const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TIME_TEXT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const SchoolSettingSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'school-settings', trim: true },
    schoolName: { type: String, trim: true, default: '' },
    logo: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    currentAcademicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
    defaultCurrency: { type: String, enum: ['USD', 'KHR'], default: 'USD' },
    supportedCurrencies: {
      type: [String],
      enum: ['USD', 'KHR'],
      default: ['USD', 'KHR']
    },
    exchangeRateUsdToKhr: { type: Number, min: 0, default: 0 },
    receiptPrefix: { type: String, trim: true, default: 'RCPT' },
    nextReceiptNumber: { type: Number, min: 1, default: 1 },
    monthlyDueDay: { type: Number, min: 1, max: 31, default: 1 },
    gracePeriodDays: { type: Number, min: 0, default: 0 },
    employeeRoles: { type: [String], default: ['teacher', 'driver', 'staff'] },
    footerText: { type: String, trim: true, default: '' },
    principalName: { type: String, trim: true, default: '' },
    qrCodeEnabled: { type: Boolean, default: true },
    attendanceEnabled: { type: Boolean, default: true },
    attendanceQrEnabled: { type: Boolean, default: true },
    attendanceFaceEnabled: { type: Boolean, default: false },
    attendanceGpsEnabled: { type: Boolean, default: true },
    attendanceSchoolLatitude: { type: Number, min: -90, max: 90, default: null },
    attendanceSchoolLongitude: { type: Number, min: -180, max: 180, default: null },
    attendanceAllowedRadius: { type: Number, min: 1, default: 100 },
    morningCheckInStart: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'morningCheckInStart must use HH:mm format'
      }
    },
    morningLateAfter: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'morningLateAfter must use HH:mm format'
      }
    },
    morningCheckoutTime: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'morningCheckoutTime must use HH:mm format'
      }
    },
    afternoonCheckInStart: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'afternoonCheckInStart must use HH:mm format'
      }
    },
    afternoonLateAfter: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'afternoonLateAfter must use HH:mm format'
      }
    },
    afternoonCheckoutTime: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'afternoonCheckoutTime must use HH:mm format'
      }
    },
    eveningCheckInStart: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'eveningCheckInStart must use HH:mm format'
      }
    },
    eveningLateAfter: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'eveningLateAfter must use HH:mm format'
      }
    },
    eveningCheckoutTime: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: (value) => value === null || value === undefined || TIME_TEXT_REGEX.test(String(value)),
        message: 'eveningCheckoutTime must use HH:mm format'
      }
    },
    attendanceLateAfter: {
      type: String,
      trim: true,
      default: '08:00',
      validate: {
        validator: (value) => TIME_TEXT_REGEX.test(String(value || '')),
        message: 'attendanceLateAfter must use HH:mm format'
      }
    },
    attendanceStart: {
      type: String,
      trim: true,
      default: '06:00',
      validate: {
        validator: (value) => TIME_TEXT_REGEX.test(String(value || '')),
        message: 'attendanceStart must use HH:mm format'
      }
    },
    attendanceEnd: {
      type: String,
      trim: true,
      default: '18:00',
      validate: {
        validator: (value) => TIME_TEXT_REGEX.test(String(value || '')),
        message: 'attendanceEnd must use HH:mm format'
      }
    },
    attendanceQrRotationSeconds: { type: Number, min: 30, max: 60, default: 30 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

SchoolSettingSchema.index({ singletonKey: 1 }, { unique: true });

module.exports = model('SchoolSetting', SchoolSettingSchema);