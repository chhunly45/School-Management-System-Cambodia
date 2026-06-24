const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const PromotionSchema = new Schema({
  seller: { type: Types.ObjectId, ref: 'User', required: true },
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  plan: { type: String, enum: ['3_days', '7_days', '30_days'], required: true },
  durationDays: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'KHR', trim: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'expired', 'cancelled'],
    default: 'pending'
  },
  purchaseDate: { type: Date, default: Date.now },
  approvedBy: { type: Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  expiringSoonNotified: { type: Boolean, default: false },
  cancelledAt: { type: Date }
}, {
  timestamps: true,
  autoIndex: false
});

PromotionSchema.index({ seller: 1, status: 1, createdAt: -1 }, { background: true });
PromotionSchema.index({ product: 1, status: 1, endDate: 1 }, { background: true });
PromotionSchema.index({ status: 1, endDate: 1 }, { background: true });

module.exports = model('Promotion', PromotionSchema);
