class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps async route handlers so rejected promises reach the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === '23505') return res.status(409).json({ error: 'Duplicate value' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, wrap, notFound, errorHandler };
