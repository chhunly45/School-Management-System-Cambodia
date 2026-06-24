const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const MessageSchema = new Schema({
  chat: { type: Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: Types.ObjectId, ref: 'User', required: true },
  content: { type: String, trim: true },
  attachmentUrl: { type: String, trim: true },
  readAt: { type: Date }
}, {
  timestamps: true
});

MessageSchema.index({ chat: 1, createdAt: 1 });

module.exports = model('Message', MessageSchema);
