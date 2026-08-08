const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ATTENDANCE_METHODS = ['QR', 'FACE', 'MANUAL'];
const ATTENDANCE_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE'];

const TeacherAttendanceSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendanceDate: { type: Date, required: true },
    checkInTime: { type: Date, default: null },
    checkOutTime: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (!value || !this.checkInTime) return true;
          return value.getTime() >= this.checkInTime.getTime();
        },
        message: 'checkOutTime must be greater than or equal to checkInTime'
      }
    },
    attendanceMethod: { type: String, enum: ATTENDANCE_METHODS, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true, default: 'PRESENT' },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    gpsAccuracy: { type: Number, min: 0, default: null },
    distanceFromSchool: { type: Number, min: 0, default: null },
    qrTokenId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceQrToken',
      default: null,
      validate: {
        validator(value) {
          if (this.attendanceMethod !== 'QR') return true;
          return !!value;
        },
        message: 'qrTokenId is required when attendanceMethod is QR'
      }
    },
    remarks: { type: String, trim: true, maxlength: 500 },
    // Reserved for future method-specific payloads (e.g., face confidence/liveness details).
    methodMetadata: { type: Schema.Types.Mixed, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

TeacherAttendanceSchema.path('attendanceDate').validate({
  validator(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
  },
  message: 'attendanceDate must be a valid date'
});

TeacherAttendanceSchema.path('deletedAt').validate({
  validator(value) {
    if (!value) return true;
    return this.isDeleted === true;
  },
  message: 'deletedAt can only be set when isDeleted is true'
});

TeacherAttendanceSchema.index(
  { teacherId: 1, attendanceDate: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
TeacherAttendanceSchema.index({ attendanceDate: -1, status: 1 });
TeacherAttendanceSchema.index({ userId: 1, attendanceDate: -1 });
TeacherAttendanceSchema.index({ qrTokenId: 1, attendanceDate: -1 });
TeacherAttendanceSchema.index({ isDeleted: 1, attendanceDate: -1 });

module.exports = model('TeacherAttendance', TeacherAttendanceSchema);
