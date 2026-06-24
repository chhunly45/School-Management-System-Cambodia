const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const AuditLogSchema = new Schema({
  admin: { type: Types.ObjectId, ref: 'User', required: true },
  report: { type: Types.ObjectId, ref: 'Report', required: false },
  action: { type: String, required: true, trim: true },
  targetType: { type: String, enum: ['product', 'user', 'chat', 'message'], required: true },
  targetId: { type: Types.ObjectId, required: true },
  details: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

AuditLogSchema.index({ admin: 1, report: 1, targetType: 1, createdAt: -1 });

module.exports = model('AuditLog', AuditLogSchema);
