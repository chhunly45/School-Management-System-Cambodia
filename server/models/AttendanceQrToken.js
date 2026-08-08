const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AttendanceQrTokenSchema = new Schema(
  {
    token: { type: String, required: true, trim: true, minlength: 16, maxlength: 256 },
    rotationNumber: { type: Number, required: true, min: 1 },
    expiresAt: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          if (!(value instanceof Date) || Number.isNaN(value.getTime())) return false;
          if (!this.createdAt) return true;
          return value.getTime() > this.createdAt.getTime();
        },
        message: 'expiresAt must be greater than createdAt'
      }
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isRevoked: { type: Boolean, default: false },
    revokedAt: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (this.isRevoked) return value instanceof Date && !Number.isNaN(value.getTime());
          return value === null;
        },
        message: 'revokedAt is required when isRevoked is true and must be null otherwise'
      }
    }
  },
  {
    timestamps: true
  }
);

AttendanceQrTokenSchema.index({ token: 1 }, { unique: true });
AttendanceQrTokenSchema.index({ rotationNumber: 1 }, { unique: true });
AttendanceQrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AttendanceQrTokenSchema.index({ isRevoked: 1, expiresAt: 1 });

module.exports = model('AttendanceQrToken', AttendanceQrTokenSchema);
