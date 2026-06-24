const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const ReportSchema = new Schema({
  reporter: { type: Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['product', 'user', 'chat', 'message'], required: true },
  targetId: { type: Types.ObjectId, required: true },
  reason: { type: String, required: true, trim: true },
  details: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'rejected'], default: 'pending' },
  handledBy: { type: Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true
});

ReportSchema.index({ targetType: 1, targetId: 1, status: 1 });

module.exports = model('Report', ReportSchema);
