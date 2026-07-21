const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const PaymentSchema = new Schema({
  receiptNumber: { type: String, required: true, trim: true, unique: true },
  studentId: { type: String, required: true, trim: true },
  studentName: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
  gradeId: { type: Schema.Types.ObjectId, ref: 'Grade' },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  paymentType: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annual', 'yearly'],
    default: 'monthly'
  },
  paymentPlan: {
    type: String,
    enum: ['monthly', 'quarterly', 'semi-annual', 'yearly'],
    default: 'monthly'
  },
  tuitionAmount: { type: Number, min: 0, default: 0 },
  amount: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, default: 0 },
  remainingBalance: { type: Number, min: 0, default: 0 },
  dueDate: { type: Date },
  monthlyDueDay: { type: Number, min: 1, max: 31, default: 1 },
  quarterlyDueDates: [{ type: String, trim: true }],
  yearlyDueDate: { type: String, trim: true },
  billingPeriod: { type: String, trim: true },
  gracePeriodDays: { type: Number, min: 0, default: 0 },
  cashier: { type: String, trim: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'check', 'mobile_money'], 
    default: 'cash' 
  },
  academicYear: { type: String, trim: true },
  semester: { type: Number, enum: [1, 2], default: 1 },
  status: { 
    type: String, 
    enum: ['paid', 'pending', 'overdue'], 
    default: 'pending' 
  },
  remarks: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

PaymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ studentId: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ dueDate: 1 });
PaymentSchema.index({ academicYear: 1, semester: 1 });
PaymentSchema.index({ academicYearId: 1, gradeId: 1, classId: 1 });
PaymentSchema.index({ studentId: 1, paymentPlan: 1, paymentDate: -1 });
PaymentSchema.index({ studentName: 'text', className: 'text', academicYear: 'text' });
PaymentSchema.index({ status: 1 });

module.exports = model('Payment', PaymentSchema);
