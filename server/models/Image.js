const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const ImageSchema = new Schema({
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  uploadedBy: { type: Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true, trim: true },
  secureUrl: { type: String, trim: true },
  publicId: { type: String, trim: true },
  altText: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

ImageSchema.index({ product: 1, sortOrder: 1 });

module.exports = model('Image', ImageSchema);
