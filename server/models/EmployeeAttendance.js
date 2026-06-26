const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const EmployeeAttendanceSchema = new Schema({
  employeeCode: { type: String, required: true, trim: true },
  employeeName: { type: String, required: true, trim: true },
  employeeType: {
    type: String,
    default: 'staff'
  },
  department: { type: String, trim: true },
  scheduleLabel: { type: String, trim: true, default: '' },
  workStartTime: { type: String, trim: true, default: '' },
  workEndTime: { type: String, trim: true, default: '' },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'late', 'leave', 'absent'],
    default: 'present'
  },
  remarks: { type: String, trim: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

EmployeeAttendanceSchema.index({ employeeCode: 1, date: 1 }, { unique: true });
EmployeeAttendanceSchema.index({ employeeType: 1, date: -1 });
EmployeeAttendanceSchema.index({ status: 1, date: -1 });
EmployeeAttendanceSchema.index({ employeeName: 'text', employeeCode: 'text', department: 'text', remarks: 'text' });

module.exports = model('EmployeeAttendance', EmployeeAttendanceSchema);