const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorName: { type: String, required: true },
  actorRole: { type: String, default: 'superadmin' },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '127.0.0.1' }
}, {
  timestamps: true
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
