const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const FuelRecordSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleCode: { type: String, trim: true, default: '' },
  transportAssignmentId: { type: Schema.Types.ObjectId, ref: 'TransportAssignment', default: null },
  assignmentDate: { type: Date, required: true },
  odometer: { type: Number, required: true, min: 0 },
  fuelType: {
    type: String,
    enum: ['gasoline', 'diesel'],
    required: true
  },
  liters: { type: Number, required: true, min: 0.0001 },
  pricePerLiter: { type: Number, required: true, min: 0 },
  currency: { type: String, trim: true, uppercase: true, required: true },
  totalCost: { type: Number, required: true, min: 0 },
  fuelStation: { type: String, required: true, trim: true },
  receiptNumber: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

FuelRecordSchema.index({ vehicleId: 1, assignmentDate: -1 });
FuelRecordSchema.index({ assignmentDate: -1 });
FuelRecordSchema.index({ currency: 1 });
FuelRecordSchema.index({ receiptNumber: 1 });
FuelRecordSchema.index({ fuelType: 1, assignmentDate: -1 });

module.exports = model('FuelRecord', FuelRecordSchema);