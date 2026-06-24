const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  labelKh: { type: String, trim: true, default: '' },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  parent: { type: Types.ObjectId, ref: 'Category', default: null },
  description: { type: String, trim: true },
  icon: { type: String, trim: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

CategorySchema.index({ name: 1, slug: 1 });

module.exports = model('Category', CategorySchema);
