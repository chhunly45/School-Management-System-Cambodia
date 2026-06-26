const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ExpenseSchema = new Schema({
  expenseDate: { type: Date, required: true },
  category: {
    type: String,
    enum: ['salary', 'fuel', 'utilities', 'maintenance', 'office_supplies', 'teaching_materials', 'other'],
    required: true
  },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, trim: true, uppercase: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'card', 'mobile_payment', 'check', 'other'],
    required: true
  },
  receiptNumber: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' }
}, {
  timestamps: true
});

ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });
ExpenseSchema.index({ paymentMethod: 1, expenseDate: -1 });
ExpenseSchema.index({ currency: 1, expenseDate: -1 });
ExpenseSchema.index({ receiptNumber: 1 });

module.exports = model('Expense', ExpenseSchema);