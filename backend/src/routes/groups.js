const router = require('express').Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { HttpError, wrap } = require('../middleware/error');

router.use(authenticate);

async function loadGroup(groupId) {
  const g = await db.query(
    `SELECT g.id, g.name, g.owner_id, g.created_at, u.name AS owner_name
     FROM groups g JOIN users u ON u.id = g.owner_id WHERE g.id = $1`,
    [groupId]
  );
  if (!g.rows[0]) return null;
  const m = await db.query(
    `SELECT u.id, u.name, u.email, u.student_id AS "studentId", gm.joined_at AS "joinedAt"
     FROM group_members gm JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1 ORDER BY gm.joined_at`,
    [groupId]
  );
  const row = g.rows[0];
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    createdAt: row.created_at,
    members: m.rows,
  };
}

async function findStudent(identifier) {
  const { rows } = await db.query(
    `SELECT id, name, role FROM users
     WHERE role = 'student' AND (LOWER(email) = LOWER($1) OR LOWER(student_id) = LOWER($1))`,
    [identifier.trim()]
  );
  return rows[0];
}

// GET /api/groups/mine — the current student's group (or null)
router.get(
  '/mine',
  requireRole('student'),
  wrap(async (req, res) => {
    const { rows } = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
    res.json({ group: rows[0] ? await loadGroup(rows[0].group_id) : null });
  })
);

// GET /api/groups — admin: all groups with members
router.get(
  '/',
  requireRole('admin'),
  wrap(async (req, res) => {
    const { rows } = await db.query('SELECT id FROM groups ORDER BY created_at DESC');
    const groups = await Promise.all(rows.map((r) => loadGroup(r.id)));
    res.json({ groups });
  })
);

// POST /api/groups — create a group; creator becomes owner + first member.
// Optional "members": array of emails / student IDs to add immediately.
router.post(
  '/',
  requireRole('student'),
  wrap(async (req, res) => {
    const { name, members = [] } = req.body || {};
    if (!name || !name.trim()) throw new HttpError(400, 'Group name is required');

    const existing = await db.query('SELECT 1 FROM group_members WHERE user_id = $1', [req.user.id]);
    if (existing.rows[0]) throw new HttpError(409, 'You are already in a group');

    const client = await db.pool.connect();
    let groupId;
    const skipped = [];
    try {
      await client.query('BEGIN');
      const g = await client.query(
        'INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING id',
        [name.trim(), req.user.id]
      );
      groupId = g.rows[0].id;
      await client.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, req.user.id]);

      for (const ident of members.filter((m) => m && m.trim())) {
        const student = await findStudent(ident);
        if (!student) { skipped.push({ identifier: ident, reason: 'Student not found' }); continue; }
        const taken = await client.query('SELECT 1 FROM group_members WHERE user_id = $1', [student.id]);
        if (taken.rows[0]) { skipped.push({ identifier: ident, reason: 'Already in a group' }); continue; }
        await client.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, student.id]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.status(201).json({ group: await loadGroup(groupId), skipped });
  })
);

// POST /api/groups/:id/members — owner adds a student by email or student ID
router.post(
  '/:id/members',
  requireRole('student'),
  wrap(async (req, res) => {
    const groupId = Number(req.params.id);
    const { identifier } = req.body || {};
    if (!identifier) throw new HttpError(400, 'identifier (email or student ID) is required');

    const group = await loadGroup(groupId);
    if (!group) throw new HttpError(404, 'Group not found');
    if (group.ownerId !== req.user.id) throw new HttpError(403, 'Only the group owner can add members');

    const student = await findStudent(identifier);
    if (!student) throw new HttpError(404, 'No student found with that email or ID');
    const taken = await db.query('SELECT 1 FROM group_members WHERE user_id = $1', [student.id]);
    if (taken.rows[0]) throw new HttpError(409, `${student.name} is already in a group`);

    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, student.id]);
    res.status(201).json({ group: await loadGroup(groupId) });
  })
);

// DELETE /api/groups/:id/members/:userId — owner removes a member, or a member leaves.
// If the owner leaves, ownership transfers; if the group is empty it is deleted.
router.delete(
  '/:id/members/:userId',
  requireRole('student'),
  wrap(async (req, res) => {
    const groupId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const group = await loadGroup(groupId);
    if (!group) throw new HttpError(404, 'Group not found');
    const isOwner = group.ownerId === req.user.id;
    if (!isOwner && userId !== req.user.id) throw new HttpError(403, 'Not allowed');
    if (!group.members.some((m) => m.id === userId)) throw new HttpError(404, 'Member not in group');

    await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    const remaining = group.members.filter((m) => m.id !== userId);
    if (remaining.length === 0) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupId]);
      return res.json({ group: null });
    }
    if (userId === group.ownerId) {
      await db.query('UPDATE groups SET owner_id = $1 WHERE id = $2', [remaining[0].id, groupId]);
    }
    const updated = await loadGroup(groupId);
    res.json({ group: req.user.id === userId ? null : updated });
  })
);

module.exports = router;
