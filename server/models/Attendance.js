const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AttendanceSchema = new Schema({
  studentId: { type: String, required: true, trim: true },
  studentName: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  remarks: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  semester: { type: Number, enum: [1, 2], default: 1 },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

AttendanceSchema.index({ studentId: 1 });
AttendanceSchema.index({ date: -1 });
AttendanceSchema.index({ className: 1, date: 1 });
AttendanceSchema.index({ academicYear: 1, semester: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = model('Attendance', AttendanceSchema);
