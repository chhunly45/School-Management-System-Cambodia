const mongoose = require('mongoose');
const { Schema, model } = mongoose;

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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

SchoolSettingSchema.index({ singletonKey: 1 }, { unique: true });

module.exports = model('SchoolSetting', SchoolSettingSchema);