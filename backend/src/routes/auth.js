const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authenticate } = require('../middleware/auth');
const { HttpError, wrap } = require('../middleware/error');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  studentId: u.student_id,
  role: u.role,
});

// POST /api/auth/register  — students self-register; professors are created by seed/admin.
// role "admin" is accepted only when the correct ADMIN_SIGNUP_CODE is supplied.
router.post(
  '/register',
  wrap(async (req, res) => {
    const { name, email, password, studentId, role, adminCode } = req.body || {};
    if (!name || !email || !password) throw new HttpError(400, 'name, email and password are required');
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Invalid email address');
    if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

    let finalRole = 'student';
    if (role === 'admin') {
      const code = process.env.ADMIN_SIGNUP_CODE;
      if (!code || adminCode !== code) throw new HttpError(403, 'Invalid professor signup code');
      finalRole = 'admin';
    }

    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await db.query(
        `INSERT INTO users (name, email, student_id, password_hash, role)
         VALUES ($1, LOWER($2), $3, $4, $5) RETURNING *`,
        [name.trim(), email.trim(), finalRole === 'student' ? studentId?.trim() || null : null, hash, finalRole]
      );
      const user = rows[0];
      res.status(201).json({ token: signToken(user), user: publicUser(user) });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'Email or student ID already registered');
      throw err;
    }
  })
);

// POST /api/auth/login
router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'email and password are required');
    const { rows } = await db.query('SELECT * FROM users WHERE email = LOWER($1)', [email.trim()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  wrap(async (req, res) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) throw new HttpError(401, 'User no longer exists');
    res.json({ user: publicUser(rows[0]) });
  })
);

module.exports = router;
