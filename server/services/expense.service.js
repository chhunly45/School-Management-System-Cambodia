const mongoose = require('mongoose');
const { Expense, SchoolSetting } = require('../models');

const MAX_PER_PAGE = 100;
const SETTINGS_SINGLETON_KEY = 'school-settings';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const parseDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Invalid expenseDate');
    error.statusCode = 400;
    throw error;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getAllowedCurrencies = async () => {
  const settings = await SchoolSetting.findOne({ singletonKey: SETTINGS_SINGLETON_KEY })
    .select('supportedCurrencies defaultCurrency')
    .lean();

  const list = Array.isArray(settings?.supportedCurrencies)
    ? settings.supportedCurrencies
    : [settings?.defaultCurrency || 'USD', 'KHR'];

  const normalized = [...new Set(list.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean))];
  return normalized.length > 0 ? normalized : ['USD', 'KHR'];
};

const normalizePayload = (payload = {}) => ({
  expenseDate: parseDateOnly(payload.expenseDate),
  category: String(payload.category || '').trim().toLowerCase(),
  description: String(payload.description || '').trim(),
  amount: Number(payload.amount),
  currency: String(payload.currency || '').trim().toUpperCase(),
  paymentMethod: String(payload.paymentMethod || '').trim().toLowerCase(),
  receiptNumber: String(payload.receiptNumber || '').trim(),
  notes: String(payload.notes || '').trim()
});

const ensureRules = async (next) => {
  if (!Number.isFinite(next.amount) || next.amount <= 0) {
    const error = new Error('Amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (!next.description) {
    const error = new Error('Description is required');
    error.statusCode = 400;
    throw error;
  }

  const allowedCurrencies = await getAllowedCurrencies();
  if (!allowedCurrencies.includes(next.currency)) {
    const error = new Error(`Currency must be one of: ${allowedCurrencies.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

const listExpenses = async (filters = {}) => {
  const query = {};

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { description: new RegExp(safeSearch, 'i') },
        { category: new RegExp(safeSearch, 'i') },
        { paymentMethod: new RegExp(safeSearch, 'i') },
        { receiptNumber: new RegExp(safeSearch, 'i') },
        { notes: new RegExp(safeSearch, 'i') },
        { currency: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.category) {
    query.category = String(filters.category).trim().toLowerCase();
  }

  if (filters.paymentMethod) {
    query.paymentMethod = String(filters.paymentMethod).trim().toLowerCase();
  }

  if (filters.currency) {
    query.currency = String(filters.currency).trim().toUpperCase();
  }

  if (filters.expenseDate) {
    const selectedDate = parseDateOnly(filters.expenseDate);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    query.expenseDate = { $gte: selectedDate, $lt: nextDate };
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Expense.find(query)
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Expense.countDocuments(query)
  ]);

  return { items, meta: { page, limit, total } };
};

const getExpenseById = async (id) => {
  ensureMongoId(id, 'expense id');
  const expense = await Expense.findById(id).lean();
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }
  return expense;
};

const createExpense = async (payload) => {
  const next = normalizePayload(payload);
  await ensureRules(next);
  return Expense.create(next);
};

const updateExpense = async (id, payload) => {
  ensureMongoId(id, 'expense id');
  const expense = await Expense.findById(id);
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }

  const next = normalizePayload({
    expenseDate: expense.expenseDate,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    paymentMethod: expense.paymentMethod,
    receiptNumber: expense.receiptNumber,
    notes: expense.notes,
    ...payload
  });

  await ensureRules(next);
  Object.assign(expense, next);
  await expense.save();
  return expense.toObject();
};

const deleteExpense = async (id) => {
  ensureMongoId(id, 'expense id');
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }
  return expense;
};

module.exports = {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
};