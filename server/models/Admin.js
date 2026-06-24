const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const AdminSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
  role: { type: String, enum: ['admin', 'moderator'], default: 'moderator' },
  permissions: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

AdminSchema.index({ role: 1 });

module.exports = model('Admin', AdminSchema);
