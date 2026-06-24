const mongoose = require('mongoose');
const { Payment } = require('../models');

const listPayments = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      query.$or = [
        { receiptNumber: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { studentName: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
        { academicYear: new RegExp(search, 'i') }
      ];
    }
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(filters.academicYear.trim(), 'i');
  }

  if (filters.semester) {
    query.semester = Number(filters.semester);
  }

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Payment.find(query).sort({ paymentDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getPaymentById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid payment id');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findById(id).lean();
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

const createPayment = async (payload) => {
  const existing = await Payment.findOne({ receiptNumber: payload.receiptNumber });
  if (existing) {
    const error = new Error('Receipt number already exists');
    error.statusCode = 409;
    throw error;
  }

  const payment = await Payment.create(payload);
  return payment;
};

const updatePayment = async (id, payload) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid payment id');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findById(id);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  if (payload.receiptNumber && payload.receiptNumber !== payment.receiptNumber) {
    const existing = await Payment.findOne({ receiptNumber: payload.receiptNumber });
    if (existing) {
      const error = new Error('Receipt number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(payment, payload);
  await payment.save();

  return payment.toObject();
};

const deletePayment = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid payment id');
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findByIdAndDelete(id);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
