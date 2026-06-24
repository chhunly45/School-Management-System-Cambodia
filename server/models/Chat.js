const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const ChatSchema = new Schema({
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  buyer: { type: Types.ObjectId, ref: 'User', required: true },
  seller: { type: Types.ObjectId, ref: 'User', required: true },
  lastMessageAt: { type: Date },
  status: { type: String, enum: ['active', 'closed', 'blocked'], default: 'active' },
  unreadCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

ChatSchema.index({ product: 1, buyer: 1, seller: 1 }, { unique: true });
ChatSchema.index({ seller: 1, buyer: 1 });

module.exports = model('Chat', ChatSchema);
