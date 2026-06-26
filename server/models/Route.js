const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RouteSchema = new Schema({
  routeCode: { type: String, required: true, trim: true, unique: true },
  routeName: { type: String, required: true, trim: true },
  pickupAreas: { type: [String], default: [] },
  estimatedDistanceKm: { type: Number, min: 0, default: 0 },
  estimatedDurationMinutes: { type: Number, min: 0, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

RouteSchema.index({ routeCode: 1 }, { unique: true, sparse: true });
RouteSchema.index({ status: 1 });
RouteSchema.index({ routeName: 1 });
RouteSchema.index({ routeName: 'text', routeCode: 'text', pickupAreas: 'text', notes: 'text' });

module.exports = model('Route', RouteSchema);