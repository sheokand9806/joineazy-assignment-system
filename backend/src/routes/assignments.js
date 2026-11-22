const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, requireRole, SECRET } = require('../middleware/auth');
const { HttpError, wrap } = require('../middleware/error');

router.use(authenticate);

const isValidUrl = (s) => {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

function validateBody(body, partial = false) {
  const { title, dueDate, onedriveLink, assignTo, groupIds } = body || {};
  if (!partial || title !== undefined) if (!title || !title.trim()) throw new HttpError(400, 'Title is required');
  if (!partial || dueDate !== undefined) if (!dueDate || isNaN(new Date(dueDate))) throw new HttpError(400, 'A valid due date is required');
  if (!partial || onedriveLink !== undefined) if (!onedriveLink || !isValidUrl(onedriveLink)) throw new HttpError(400, 'A valid OneDrive link (http/https) is required');
  if (assignTo !== undefined && !['all', 'groups'].includes(assignTo)) throw new HttpError(400, "assignTo must be 'all' or 'groups'");
  if (assignTo === 'groups' && (!Array.isArray(groupIds) || groupIds.length === 0)) {
    throw new HttpError(400, 'Select at least one group');
  }
}

async function setAssignedGroups(client, assignmentId, assignTo, groupIds) {
  await client.query('DELETE FROM assignment_groups WHERE assignment_id = $1', [assignmentId]);
  if (assignTo === 'groups') {
    for (const gid of groupIds) {
      await client.query(
        'INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [assignmentId, gid]
      );
    }
  }
}

// ---------- helpers for admin stats ----------

// Groups targeted by an assignment (all groups, or the selected ones) with confirmation info.
async function targetGroups(assignmentId) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, s.confirmed_at, s.confirmed_by, cu.name AS confirmed_by_name
     FROM assignments a
     JOIN groups g ON a.assign_to = 'all'
        OR g.id IN (SELECT group_id FROM assignment_groups WHERE assignment_id = a.id)
     LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
     LEFT JOIN users cu ON cu.id = s.confirmed_by
     WHERE a.id = $1
     ORDER BY g.name`,
    [assignmentId]
  );
  return rows;
}

// ---------- GET /api/assignments ----------
router.get(
  '/',
  wrap(async (req, res) => {
    if (req.user.role === 'admin') {
      const { rows } = await db.query(
        `SELECT a.*,
           COALESCE((SELECT ARRAY_AGG(group_id) FROM assignment_groups WHERE assignment_id = a.id), '{}') AS group_ids,
           CASE WHEN a.assign_to = 'all' THEN (SELECT COUNT(*) FROM groups)
                ELSE (SELECT COUNT(*) FROM assignment_groups WHERE assignment_id = a.id) END::int AS total_groups,
           (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id)::int AS confirmed_groups
         FROM assignments a ORDER BY a.due_date ASC`
      );
      return res.json({
        assignments: rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          dueDate: r.due_date,
          onedriveLink: r.onedrive_link,
          assignTo: r.assign_to,
          groupIds: r.group_ids,
          totalGroups: r.total_groups,
          confirmedGroups: r.confirmed_groups,
          createdAt: r.created_at,
        })),
      });
    }

    // Student: assignments for "all" or targeted at the student's group
    const gm = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
    const groupId = gm.rows[0]?.group_id || null;
    const { rows } = await db.query(
      `SELECT a.*, s.confirmed_at, s.confirmed_by, cu.name AS confirmed_by_name
       FROM assignments a
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
       LEFT JOIN users cu ON cu.id = s.confirmed_by
       WHERE a.assign_to = 'all'
          OR EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = a.id AND ag.group_id = $1)
       ORDER BY a.due_date ASC`,
      [groupId]
    );
    res.json({
      groupId,
      assignments: rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        dueDate: r.due_date,
        onedriveLink: r.onedrive_link,
        assignTo: r.assign_to,
        confirmed: !!r.confirmed_at,
        confirmedAt: r.confirmed_at,
        confirmedByName: r.confirmed_by_name,
      })),
    });
  })
);

// ---------- GET /api/assignments/:id (admin detail: group-wise + student-wise) ----------
router.get(
  '/:id',
  requireRole('admin'),
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const a = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    if (!a.rows[0]) throw new HttpError(404, 'Assignment not found');
    const row = a.rows[0];
    const groups = await targetGroups(id);

    const memberRows = groups.length
      ? (await db.query(
          `SELECT gm.group_id, u.id, u.name, u.email, u.student_id AS "studentId"
           FROM group_members gm JOIN users u ON u.id = gm.user_id
           WHERE gm.group_id = ANY($1::int[]) ORDER BY u.name`,
          [groups.map((g) => g.id)]
        )).rows
      : [];

    const groupsOut = groups.map((g) => {
      const members = memberRows
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          id: m.id, name: m.name, email: m.email, studentId: m.studentId,
          // Group submission covers every member; also flag who actually confirmed.
          confirmed: !!g.confirmed_at,
          confirmedByThisStudent: g.confirmed_by === m.id,
        }));
      return {
        id: g.id,
        name: g.name,
        confirmed: !!g.confirmed_at,
        confirmedAt: g.confirmed_at,
        confirmedByName: g.confirmed_by_name,
        members,
      };
    });

    const students = groupsOut.flatMap((g) =>
      g.members.map((m) => ({ ...m, groupId: g.id, groupName: g.name, confirmedAt: g.confirmedAt }))
    );

    res.json({
      assignment: {
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        onedriveLink: row.onedrive_link,
        assignTo: row.assign_to,
        groupIds: groups.map((g) => g.id),
      },
      summary: {
        totalGroups: groupsOut.length,
        confirmedGroups: groupsOut.filter((g) => g.confirmed).length,
        totalStudents: students.length,
        confirmedStudents: students.filter((s) => s.confirmed).length,
      },
      groups: groupsOut,
      students,
    });
  })
);

// ---------- POST /api/assignments ----------
router.post(
  '/',
  requireRole('admin'),
  wrap(async (req, res) => {
    validateBody(req.body);
    const { title, description = '', dueDate, onedriveLink, assignTo = 'all', groupIds = [] } = req.body;
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO assignments (title, description, due_date, onedrive_link, assign_to, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [title.trim(), description, new Date(dueDate), onedriveLink.trim(), assignTo, req.user.id]
      );
      await setAssignedGroups(client, rows[0].id, assignTo, groupIds);
      await client.query('COMMIT');
      res.status(201).json({ id: rows[0].id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// ---------- PUT /api/assignments/:id ----------
router.put(
  '/:id',
  requireRole('admin'),
  wrap(async (req, res) => {
    validateBody(req.body);
    const id = Number(req.params.id);
    const { title, description = '', dueDate, onedriveLink, assignTo = 'all', groupIds = [] } = req.body;
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const { rowCount } = await client.query(
        `UPDATE assignments SET title=$1, description=$2, due_date=$3, onedrive_link=$4,
           assign_to=$5, updated_at=NOW() WHERE id=$6`,
        [title.trim(), description, new Date(dueDate), onedriveLink.trim(), assignTo, id]
      );
      if (!rowCount) throw new HttpError(404, 'Assignment not found');
      await setAssignedGroups(client, id, assignTo, groupIds);
      await client.query('COMMIT');
      res.json({ id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// ---------- DELETE /api/assignments/:id ----------
router.delete(
  '/:id',
  requireRole('admin'),
  wrap(async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM assignments WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) throw new HttpError(404, 'Assignment not found');
    res.status(204).end();
  })
);

// ---------- Two-step submission confirmation (students) ----------
// Step 1: "Yes, I have submitted" -> server issues a short-lived confirmation token.
// Step 2: client sends that token back to finalise. Prevents accidental one-click confirms
// and enforces the two-step flow on the server, not just in the UI.
async function studentContext(req, assignmentId) {
  const gm = await db.query('SELECT group_id FROM group_members WHERE user_id = $1', [req.user.id]);
  const groupId = gm.rows[0]?.group_id;
  if (!groupId) throw new HttpError(400, 'Join or create a group before confirming a submission');

  const a = await db.query(
    `SELECT a.id FROM assignments a
     WHERE a.id = $1 AND (a.assign_to = 'all'
       OR EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id = a.id AND ag.group_id = $2))`,
    [assignmentId, groupId]
  );
  if (!a.rows[0]) throw new HttpError(404, 'Assignment not found for your group');
  return groupId;
}

router.post(
  '/:id/submission/initiate',
  requireRole('student'),
  wrap(async (req, res) => {
    const assignmentId = Number(req.params.id);
    const groupId = await studentContext(req, assignmentId);
    const done = await db.query('SELECT 1 FROM submissions WHERE assignment_id=$1 AND group_id=$2', [assignmentId, groupId]);
    if (done.rows[0]) throw new HttpError(409, 'Submission already confirmed for your group');
    const confirmToken = jwt.sign(
      { purpose: 'confirm-submission', uid: req.user.id, aid: assignmentId, gid: groupId },
      SECRET(),
      { expiresIn: '2m' }
    );
    res.json({ confirmToken, expiresInSeconds: 120 });
  })
);

router.post(
  '/:id/submission/confirm',
  requireRole('student'),
  wrap(async (req, res) => {
    const assignmentId = Number(req.params.id);
    const { confirmToken } = req.body || {};
    let payload;
    try {
      payload = jwt.verify(confirmToken || '', SECRET());
    } catch {
      throw new HttpError(400, 'Confirmation expired or invalid. Please start again.');
    }
    if (payload.purpose !== 'confirm-submission' || payload.uid !== req.user.id || payload.aid !== assignmentId) {
      throw new HttpError(400, 'Confirmation token does not match this request');
    }
    const groupId = await studentContext(req, assignmentId);
    if (groupId !== payload.gid) throw new HttpError(400, 'Your group changed. Please start again.');

    const { rows } = await db.query(
      `INSERT INTO submissions (assignment_id, group_id, confirmed_by)
       VALUES ($1, $2, $3) ON CONFLICT (assignment_id, group_id) DO NOTHING
       RETURNING confirmed_at`,
      [assignmentId, groupId, req.user.id]
    );
    if (!rows[0]) throw new HttpError(409, 'Submission already confirmed for your group');
    res.status(201).json({ confirmed: true, confirmedAt: rows[0].confirmed_at });
  })
);

module.exports = router;
