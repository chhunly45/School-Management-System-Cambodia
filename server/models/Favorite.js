const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const FavoriteSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true },
  product: { type: Types.ObjectId, ref: 'Product', required: true }
}, {
  timestamps: true
});

FavoriteSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = model('Favorite', FavoriteSchema);
