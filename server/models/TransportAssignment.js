const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TransportAssignmentSchema = new Schema({
  assignmentDate: { type: Date, required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleCode: { type: String, trim: true, default: '' },
  routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
  routeCode: { type: String, trim: true, default: '' },
  driverEmployeeCode: { type: String, required: true, trim: true },
  driverName: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['scheduled', 'running', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

TransportAssignmentSchema.index({ assignmentDate: -1 });
TransportAssignmentSchema.index({ vehicleId: 1, assignmentDate: 1 });
TransportAssignmentSchema.index({ routeId: 1, assignmentDate: 1 });
TransportAssignmentSchema.index({ driverEmployeeCode: 1, assignmentDate: 1 });
TransportAssignmentSchema.index({ status: 1, assignmentDate: -1 });

module.exports = model('TransportAssignment', TransportAssignmentSchema);