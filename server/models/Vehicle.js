const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const VehicleSchema = new Schema({
  vehicleCode: { type: String, required: true, trim: true, unique: true },
  plateNumber: { type: String, required: true, trim: true, unique: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, min: 1900, max: 2100, default: 2000 },
  color: { type: String, trim: true, default: '' },
  seatCapacity: { type: Number, min: 1, default: 1 },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel'],
    default: 'gasoline'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out_of_service'],
    default: 'active'
  },
  notes: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

VehicleSchema.index({ vehicleCode: 1 }, { unique: true, sparse: true });
VehicleSchema.index({ plateNumber: 1 }, { unique: true, sparse: true });
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ fuelType: 1 });
VehicleSchema.index({ brand: 'text', model: 'text', vehicleCode: 'text', plateNumber: 'text', notes: 'text' });

module.exports = model('Vehicle', VehicleSchema);