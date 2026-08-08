const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ATTENDANCE_METHODS = ['QR', 'FACE', 'MANUAL'];
const ATTEMPT_RESULTS = ['SUCCESS', 'FAILED'];
const ATTEMPT_REASON_CODES = [
  'SUCCESS',
  'OUTSIDE_RADIUS',
  'QR_EXPIRED',
  'QR_INVALID',
  'GPS_DENIED',
  'DUPLICATE',
  'SESSION_EXPIRED',
  'UNKNOWN_ERROR'
];

const AttendanceAttemptLogSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    attendanceMethod: { type: String, enum: ATTENDANCE_METHODS, required: true },
    requestTime: { type: Date, required: true, default: Date.now },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    gpsAccuracy: { type: Number, min: 0, default: null },
    device: { type: String, trim: true, maxlength: 200, default: '' },
    ipAddress: { type: String, trim: true, maxlength: 120, default: '' },
    userAgent: { type: String, trim: true, maxlength: 1000, default: '' },
    qrTokenId: { type: Schema.Types.ObjectId, ref: 'AttendanceQrToken', default: null },
    result: { type: String, enum: ATTEMPT_RESULTS, required: true },
    reasonCode: {
      type: String,
      enum: ATTEMPT_REASON_CODES,
      required: true,
      validate: {
        validator(value) {
          if (this.result === 'SUCCESS') {
            return value === 'SUCCESS';
          }
          return value !== 'SUCCESS';
        },
        message: 'reasonCode must be SUCCESS when result is SUCCESS, otherwise it must be a failure reason'
      }
    },
    requestId: { type: String, required: true, trim: true, minlength: 8, maxlength: 128 }
  },
  {
    timestamps: false
  }
);

const ATTEMPT_LOG_RETENTION_SECONDS = 60 * 60 * 24 * 90;

AttendanceAttemptLogSchema.index({ requestId: 1 }, { unique: true });
AttendanceAttemptLogSchema.index({ requestTime: -1 });
AttendanceAttemptLogSchema.index({ teacherId: 1, requestTime: -1 });
AttendanceAttemptLogSchema.index({ userId: 1, requestTime: -1 });
AttendanceAttemptLogSchema.index({ result: 1, reasonCode: 1, requestTime: -1 });
AttendanceAttemptLogSchema.index({ requestTime: 1 }, { expireAfterSeconds: ATTEMPT_LOG_RETENTION_SECONDS });

module.exports = model('AttendanceAttemptLog', AttendanceAttemptLogSchema);
