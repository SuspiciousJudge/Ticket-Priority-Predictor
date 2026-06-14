const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  method: String,
  path: String,
  body: mongoose.Schema.Types.Mixed,
  params: mongoose.Schema.Types.Mixed,
  query: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
