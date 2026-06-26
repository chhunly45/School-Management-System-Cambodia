const mongoose = require('mongoose');
const { Payment, AcademicYear, Grade, Class: ClassModel, Student, SchoolSetting } = require('../models');

const MAX_PER_PAGE = 100;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureMongoId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const shouldIncludeRelations = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const normalizePlan = (value, fallback = 'monthly') => {
  const normalized = String(value || fallback).toLowerCase();
  if (['monthly', 'quarterly', 'yearly'].includes(normalized)) return normalized;
  return fallback;
};

const toMoney = (value = 0) => Number(Number(value || 0).toFixed(2));

const SCHOOL_SETTINGS_KEY = 'school-settings';

const getSchoolSettingsSnapshot = async () => {
  const settings = await SchoolSetting.findOne({ singletonKey: SCHOOL_SETTINGS_KEY }).lean();
  return settings || {
    schoolName: '',
    logo: '',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'KHR'],
    exchangeRateUsdToKhr: 0,
    receiptPrefix: 'RCPT',
    nextReceiptNumber: 1,
    monthlyDueDay: 1,
    gracePeriodDays: 0,
    footerText: '',
    principalName: '',
    qrCodeEnabled: true
  };
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const formatDateOnly = (date) => {
  if (!date) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const resolveMonthlyDueDate = (baseDate, dueDay) => {
  const date = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));
  const day = Math.min(Math.max(Number(dueDay) || 1, 1), 31);
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return date;
};

const resolveQuarterlyDueDate = (baseDate, quarterlyDueDates = []) => {
  const monthDay = formatDateOnly(baseDate).slice(5);
  const allowed = quarterlyDueDates.map((item) => String(item).trim()).filter(Boolean);
  if (allowed.length === 0) return null;
  const matched = allowed.find((item) => item.endsWith(monthDay));
  if (matched) return parseDateOnly(`${baseDate.getUTCFullYear()}-${matched.slice(5)}`);
  const first = allowed[0];
  return parseDateOnly(`${baseDate.getUTCFullYear()}-${first.slice(5)}`);
};

const resolveYearlyDueDate = (baseDate, yearlyDueDate) => {
  if (!yearlyDueDate) return null;
  const normalized = String(yearlyDueDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return parseDateOnly(normalized);
  if (/^\d{2}-\d{2}$/.test(normalized)) return parseDateOnly(`${baseDate.getUTCFullYear()}-${normalized}`);
  return null;
};

const resolveDueDate = (payload) => {
  const paymentDate = parseDateOnly(payload.paymentDate) || new Date();
  const plan = normalizePlan(payload.paymentPlan || payload.paymentType);

  if (payload.dueDate) {
    const provided = parseDateOnly(payload.dueDate);
    if (provided) return provided;
  }

  if (plan === 'monthly') {
    return resolveMonthlyDueDate(paymentDate, payload.monthlyDueDay);
  }

  if (plan === 'quarterly') {
    const dueDate = resolveQuarterlyDueDate(paymentDate, payload.quarterlyDueDates);
    if (dueDate) return dueDate;
  }

  if (plan === 'yearly') {
    const dueDate = resolveYearlyDueDate(paymentDate, payload.yearlyDueDate);
    if (dueDate) return dueDate;
  }

  return paymentDate;
};

const resolveSettingsDrivenDefaults = async () => {
  const settings = await getSchoolSettingsSnapshot();
  return {
    monthlyDueDay: Number(settings.monthlyDueDay || 1),
    gracePeriodDays: Number(settings.gracePeriodDays || 0)
  };
};

const resolveGracePeriodDays = (payload) => {
  const value = Number(payload.gracePeriodDays);
  if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  return 0;
};

const evaluatePaymentStatus = (payment, now = new Date()) => {
  const paid = Number(payment.remainingBalance || 0) <= 0;
  if (paid) {
    return { status: 'paid', statusLabel: 'Paid' };
  }

  const dueDate = parseDateOnly(payment.dueDate);
  if (!dueDate) {
    return { status: 'overdue', statusLabel: 'Overdue' };
  }

  const gracePeriodDays = Number(payment.gracePeriodDays || 0);
  const graceStart = addDays(dueDate, 1);
  const graceEnd = addDays(dueDate, gracePeriodDays);
  const current = parseDateOnly(now) || now;
  const currentDate = current instanceof Date ? current : new Date();

  if (currentDate < graceStart) {
    return { status: 'due_soon', statusLabel: 'Due Soon' };
  }

  if (currentDate >= graceStart && currentDate <= graceEnd) {
    return { status: 'grace_period', statusLabel: 'Grace Period' };
  }

  return { status: 'overdue', statusLabel: 'Overdue' };
};

const formatPaymentForResponse = (payment) => {
  if (!payment) return payment;
  const plain = typeof payment.toObject === 'function' ? payment.toObject() : { ...payment };
  const computed = evaluatePaymentStatus(plain);
  return {
    ...plain,
    dueDate: plain.dueDate ? new Date(plain.dueDate).toISOString() : null,
    paymentLifecycleStatus: computed.status,
    paymentLifecycleStatusLabel: computed.statusLabel
  };
};

const generateReceiptNumber = async () => {
  const settings = await getSchoolSettingsSnapshot();
  const prefix = String(settings.receiptPrefix || 'RCPT').trim() || 'RCPT';
  const nextNumber = Math.max(Number(settings.nextReceiptNumber || 1), 1);
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
};

const ensureReferencesExist = async ({ academicYearId, gradeId, classId, studentId }) => {
  const checks = [];

  if (academicYearId) {
    ensureMongoId(academicYearId, 'academicYearId');
    checks.push(
      AcademicYear.exists({ _id: academicYearId }).then((exists) => {
        if (!exists) {
          const error = new Error('Academic year not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  if (gradeId) {
    ensureMongoId(gradeId, 'gradeId');
    checks.push(
      Grade.exists({ _id: gradeId }).then((exists) => {
        if (!exists) {
          const error = new Error('Grade not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  if (classId) {
    ensureMongoId(classId, 'classId');
    checks.push(
      ClassModel.exists({ _id: classId }).then((exists) => {
        if (!exists) {
          const error = new Error('Class not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  if (studentId) {
    checks.push(
      Student.exists({ studentId }).then((exists) => {
        if (!exists) {
          const error = new Error('Student not found');
          error.statusCode = 404;
          throw error;
        }
      })
    );
  }

  await Promise.all(checks);
};

const computeRemainingBalance = (tuitionAmount, discount, amount, suppliedRemaining) => {
  if (suppliedRemaining !== undefined && suppliedRemaining !== null) {
    return Math.max(toMoney(suppliedRemaining), 0);
  }

  const totalDue = Math.max(toMoney(tuitionAmount) - toMoney(discount), 0);
  return Math.max(toMoney(totalDue - toMoney(amount)), 0);
};

const withOptionalPopulation = (queryBuilder, includeRelations) => {
  if (!includeRelations) return queryBuilder;

  return queryBuilder
    .populate('academicYearId', 'code name status')
    .populate('gradeId', 'code name level status')
    .populate('classId', 'className academicYearId gradeId status');
};

const listPayments = async (filters = {}) => {
  const query = {};
  const includeRelations = shouldIncludeRelations(filters.includeRelations);

  if (filters.search) {
    const search = String(filters.search).trim();
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { receiptNumber: new RegExp(safeSearch, 'i') },
        { studentId: new RegExp(safeSearch, 'i') },
        { studentName: new RegExp(safeSearch, 'i') },
        { className: new RegExp(safeSearch, 'i') },
        { academicYear: new RegExp(safeSearch, 'i') }
      ];
    }
  }

  if (filters.studentId) {
    query.studentId = String(filters.studentId).trim();
  }

  if (filters.status) {
    if (filters.status === 'due_soon' || filters.status === 'grace_period') {
      query.remainingBalance = { $gt: 0 };
    } else {
      query.status = filters.status;
    }
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.paymentType) {
    query.paymentType = normalizePlan(filters.paymentType);
  }

  if (filters.paymentPlan) {
    query.paymentPlan = normalizePlan(filters.paymentPlan);
  }

  if (filters.academicYear) {
    query.academicYear = new RegExp(escapeRegex(String(filters.academicYear).trim()), 'i');
  }

  if (filters.academicYearId) {
    ensureMongoId(filters.academicYearId, 'academicYearId');
    query.academicYearId = filters.academicYearId;
  }

  if (filters.gradeId) {
    ensureMongoId(filters.gradeId, 'gradeId');
    query.gradeId = filters.gradeId;
  }

  if (filters.classId) {
    ensureMongoId(filters.classId, 'classId');
    query.classId = filters.classId;
  }

  if (filters.semester) {
    query.semester = Number(filters.semester);
  }

  const page = Number(filters.page) || 1;
  const rawLimit = Number(filters.perPage) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PER_PAGE);
  const skip = (page - 1) * limit;

  const findQuery = withOptionalPopulation(
    Payment.find(query).sort({ paymentDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    includeRelations
  );

  const [items, total] = await Promise.all([
    findQuery.lean(),
    Payment.countDocuments(query)
  ]);

  return {
    items: items.map((item) => {
      const computed = evaluatePaymentStatus(item);
      return {
        ...item,
        paymentLifecycleStatus: computed.status,
        paymentLifecycleStatusLabel: computed.statusLabel
      };
    }),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getPaymentById = async (id, options = {}) => {
  ensureMongoId(id, 'payment id');
  const includeRelations = shouldIncludeRelations(options.includeRelations);

  const paymentQuery = withOptionalPopulation(Payment.findById(id), includeRelations);
  const payment = await paymentQuery.lean();
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  return formatPaymentForResponse(payment);
};

const createPayment = async (payload) => {
  const receiptNumber = payload.receiptNumber ? String(payload.receiptNumber).trim() : await generateReceiptNumber();

  const existing = await Payment.findOne({ receiptNumber });
  if (existing) {
    const error = new Error('Receipt number already exists');
    error.statusCode = 409;
    throw error;
  }

  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId,
    studentId: payload.studentId
  });

  const amount = toMoney(payload.amount);
  const discount = toMoney(payload.discount || 0);
  const tuitionAmount = toMoney(payload.tuitionAmount || payload.amount || 0);
  const remainingBalance = computeRemainingBalance(tuitionAmount, discount, amount, payload.remainingBalance);
  const paymentPlan = normalizePlan(payload.paymentPlan || payload.paymentType);
  const paymentType = normalizePlan(payload.paymentType || payload.paymentPlan);
  const settingsDefaults = await resolveSettingsDrivenDefaults();
  const dueDate = resolveDueDate({ ...payload, ...settingsDefaults, paymentPlan, paymentType });
  const gracePeriodDays = payload.gracePeriodDays !== undefined ? resolveGracePeriodDays(payload) : settingsDefaults.gracePeriodDays;

  const payment = await Payment.create({
    ...payload,
    receiptNumber,
    amount,
    discount,
    tuitionAmount,
    remainingBalance,
    paymentPlan,
    paymentType,
    dueDate,
    gracePeriodDays,
    cashier: payload.cashier || payload.createdByName || 'System'
  });
  return formatPaymentForResponse(payment);
};

const updatePayment = async (id, payload) => {
  ensureMongoId(id, 'payment id');

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

  await ensureReferencesExist({
    academicYearId: payload.academicYearId,
    gradeId: payload.gradeId,
    classId: payload.classId,
    studentId: payload.studentId
  });

  const nextAmount = payload.amount !== undefined ? toMoney(payload.amount) : payment.amount;
  const nextDiscount = payload.discount !== undefined ? toMoney(payload.discount) : payment.discount || 0;
  const nextTuitionAmount = payload.tuitionAmount !== undefined ? toMoney(payload.tuitionAmount) : payment.tuitionAmount || payment.amount;
  const nextRemainingBalance = computeRemainingBalance(
    nextTuitionAmount,
    nextDiscount,
    nextAmount,
    payload.remainingBalance
  );
  const nextPlan = normalizePlan(payload.paymentPlan || payload.paymentType || payment.paymentPlan || payment.paymentType);
  const nextType = normalizePlan(payload.paymentType || payload.paymentPlan || payment.paymentType || payment.paymentPlan);
  const settingsDefaults = await resolveSettingsDrivenDefaults();
  const nextDueDate = payload.dueDate
    ? parseDateOnly(payload.dueDate)
    : resolveDueDate({ ...payment.toObject(), ...payload, ...settingsDefaults, paymentPlan: nextPlan, paymentType: nextType });
  const nextGracePeriodDays = payload.gracePeriodDays !== undefined ? resolveGracePeriodDays(payload) : Number(payment.gracePeriodDays || settingsDefaults.gracePeriodDays || 0);

  Object.assign(payment, {
    ...payload,
    amount: nextAmount,
    discount: nextDiscount,
    tuitionAmount: nextTuitionAmount,
    remainingBalance: nextRemainingBalance,
    paymentPlan: nextPlan,
    paymentType: nextType,
    dueDate: nextDueDate,
    gracePeriodDays: nextGracePeriodDays,
    cashier: payload.cashier || payment.cashier
  });
  await payment.save();

  return formatPaymentForResponse(payment);
};

const deletePayment = async (id) => {
  ensureMongoId(id, 'payment id');

  const payment = await Payment.findByIdAndDelete(id);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  return payment;
};

const getMonthlyPaymentSummary = async (filters = {}) => {
  const now = new Date();
  const year = Number(filters.year) || now.getFullYear();
  const month = Number(filters.month) || now.getMonth() + 1;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const match = {
    paymentDate: { $gte: startDate, $lt: endDate }
  };

  if (filters.academicYearId) {
    ensureMongoId(filters.academicYearId, 'academicYearId');
    match.academicYearId = new mongoose.Types.ObjectId(filters.academicYearId);
  }

  if (filters.gradeId) {
    ensureMongoId(filters.gradeId, 'gradeId');
    match.gradeId = new mongoose.Types.ObjectId(filters.gradeId);
  }

  if (filters.classId) {
    ensureMongoId(filters.classId, 'classId');
    match.classId = new mongoose.Types.ObjectId(filters.classId);
  }

  const [totals, byPlan, byStatus] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          totalDiscount: { $sum: '$discount' },
          totalRemainingBalance: { $sum: '$remainingBalance' },
          totalRecords: { $sum: 1 }
        }
      }
    ]),
    Payment.aggregate([
      { $match: match },
      { $group: { _id: '$paymentPlan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, plan: '$_id', total: 1, count: 1 } },
      { $sort: { plan: 1 } }
    ]),
    Payment.aggregate([
      { $match: match },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', total: 1, count: 1 } },
      { $sort: { status: 1 } }
    ])
  ]);

  const lifecycleCounts = await Payment.aggregate([
    { $match: { paymentDate: { $gte: startDate, $lt: endDate }, remainingBalance: { $gt: 0 } } },
    {
      $project: {
        remainingBalance: 1,
        dueDate: 1,
        gracePeriodDays: { $ifNull: ['$gracePeriodDays', 0] }
      }
    }
  ]);

  const lifecycleSummary = lifecycleCounts.reduce(
    (acc, item) => {
      const result = evaluatePaymentStatus(item, new Date());
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    },
    { paid: 0, due_soon: 0, grace_period: 0, overdue: 0 }
  );

  return {
    period: {
      year,
      month,
      startDate,
      endDate: new Date(endDate.getTime() - 1)
    },
    totals: totals[0] || {
      totalPaid: 0,
      totalDiscount: 0,
      totalRemainingBalance: 0,
      totalRecords: 0
    },
    byPlan,
    byStatus,
    lifecycleSummary
  };
};

module.exports = {
  listPayments,
  getMonthlyPaymentSummary,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
