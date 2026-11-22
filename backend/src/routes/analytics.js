const router = require('express').Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { wrap } = require('../middleware/error');

router.use(authenticate, requireRole('admin'));

// GET /api/analytics — summary counts + per-assignment and per-group completion
router.get(
  '/',
  wrap(async (req, res) => {
    const counts = (await db.query(
      `SELECT (SELECT COUNT(*) FROM users WHERE role='student')::int AS students,
              (SELECT COUNT(*) FROM groups)::int AS groups,
              (SELECT COUNT(*) FROM assignments)::int AS assignments,
              (SELECT COUNT(*) FROM submissions)::int AS confirmations`
    )).rows[0];

    // Per assignment: how many targeted groups have confirmed
    const perAssignment = (await db.query(
      `SELECT a.id, a.title, a.due_date AS "dueDate",
         CASE WHEN a.assign_to='all' THEN (SELECT COUNT(*) FROM groups)
              ELSE (SELECT COUNT(*) FROM assignment_groups WHERE assignment_id=a.id) END::int AS total,
         (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id=a.id)::int AS confirmed
       FROM assignments a ORDER BY a.due_date`
    )).rows;

    // Per group: assignments targeted vs confirmed => group performance
    const perGroup = (await db.query(
      `SELECT g.id, g.name,
         (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id=g.id)::int AS members,
         (SELECT COUNT(*) FROM assignments a
            WHERE a.assign_to='all'
               OR EXISTS (SELECT 1 FROM assignment_groups ag WHERE ag.assignment_id=a.id AND ag.group_id=g.id))::int AS total,
         (SELECT COUNT(*) FROM submissions s WHERE s.group_id=g.id)::int AS confirmed
       FROM groups g ORDER BY g.name`
    )).rows;

    const totalSlots = perAssignment.reduce((n, a) => n + a.total, 0);
    const doneSlots = perAssignment.reduce((n, a) => n + a.confirmed, 0);

    res.json({
      counts,
      overallCompletion: totalSlots ? Math.round((doneSlots / totalSlots) * 100) : 0,
      perAssignment,
      perGroup,
    });
  })
);

module.exports = router;
