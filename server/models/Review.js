const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const ReviewSchema = new Schema({
  seller: { type: Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: Types.ObjectId, ref: 'User', required: true },
  product: { type: Types.ObjectId, ref: 'Product' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

ReviewSchema.index({ seller: 1, reviewer: 1 }, { unique: true });

module.exports = model('Review', ReviewSchema);
