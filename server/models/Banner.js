const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const BannerSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  imagePublicId: { type: String, trim: true },
  linkUrl: { type: String, trim: true },
  position: { type: String, default: 'top', enum: ['top', 'inline', 'sidebar'] },
  enabled: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true
});

BannerSchema.index({ position: 1, enabled: 1, sortOrder: 1 });

module.exports = model('Banner', BannerSchema);
