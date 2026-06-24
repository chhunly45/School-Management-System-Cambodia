const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TransportSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  routeName: { type: String, required: true, trim: true },
  pickupPoint: { type: String, required: true, trim: true },
  dropoffPoint: { type: String, trim: true },
  driverName: { type: String, trim: true },
  vehicleNumber: { type: String, trim: true },
  monthlyFee: { type: Number, min: 0, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  academicYear: { type: String, trim: true },
  remarks: { type: String, trim: true }
}, {
  timestamps: true
});

TransportSchema.index({ studentId: 1 });
TransportSchema.index({ routeName: 1 });
TransportSchema.index({ academicYear: 1 });
TransportSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

module.exports = model('Transport', TransportSchema);
