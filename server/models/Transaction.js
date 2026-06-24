const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const TransactionSchema = new Schema({
  seller: { type: Types.ObjectId, ref: 'User', required: true },
  buyer: { type: Types.ObjectId, ref: 'User', required: true },
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'KHR', trim: true },
  transactionType: { type: String, enum: ['sale', 'refund', 'commission', 'withdrawal'], default: 'sale' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'completed' },
  paymentMethod: { type: String, trim: true },
  reference: { type: String, trim: true },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

TransactionSchema.index({ seller: 1, createdAt: -1 });
TransactionSchema.index({ buyer: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, transactionType: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

module.exports = model('Transaction', TransactionSchema);
