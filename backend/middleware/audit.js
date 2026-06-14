const AuditLog = require('../models/AuditLog');

module.exports = async function auditLogger(req, res, next) {
  try {
    const method = (req.method || '').toUpperCase();
    if (!['POST', 'PUT', 'DELETE'].includes(method)) return next();

    const entry = new AuditLog({
      user: req.user ? req.user._id : null,
      method,
      path: req.originalUrl || req.url,
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
      ip: req.ip || req.connection && req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
    });

    // Fire-and-forget; don't block request on logging
    entry.save().catch((e) => console.warn('Audit log save failed:', e && e.message));
  } catch (e) {
    console.warn('Audit logger error:', e && e.message);
  }
  return next();
};
