const jwt = require('jsonwebtoken');

const SECRET = () => process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, SECRET());
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `${role} access only` });
    }
    next();
  };
}

module.exports = { signToken, authenticate, requireRole, SECRET };
