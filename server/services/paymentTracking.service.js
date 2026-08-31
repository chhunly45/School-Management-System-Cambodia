const mongoose = require('mongoose');
const { Student, Payment, Transport } = require('../models');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitFullName = (fullName = '') => {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return { englishName: '', khmerName: '' };

  const parts = trimmed.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      englishName: parts[0],
      khmerName: parts.slice(1).join(' / ')
    };
  }

  return { englishName: trimmed, khmerName: '' };
};

const getPlanDurationMonths = (plan = 'monthly') => {
  if (plan === 'quarterly') return 3;
  if (plan === 'semi-annual' || plan === 'semiannual') return 6;
  if (plan === 'yearly' || plan === 'annual') return 12;
  return 1;
};

const getTransportMatchKey = (value) => {
  if (!value && value !== 0) return '';
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && value.toString) return value.toString();
  return String(value).trim();
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const normalizeSession = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  if (lower === 'morning') return 'Morning';
  if (lower === 'afternoon') return 'Afternoon';
  if (lower === 'evening') return 'Evening';
  return normalized;
};

const calculateDaysLeft = (dueDate, today = new Date()) => {
  const targetDate = parseDateOnly(dueDate) || parseDateOnly(today) || new Date();
  const currentDate = parseDateOnly(today) || new Date();
  const diffMs = targetDate.getTime() - currentDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const buildTrackingStatus = ({ dueDate, remainingBalance = 0, today = new Date() } = {}) => {
  const daysLeft = calculateDaysLeft(dueDate, today);
  const numericRemaining = Number(remainingBalance || 0);

  if (numericRemaining <= 0 && daysLeft > 5) {
    return { code: 'paid', status: 'Paid', daysLeft };
  }

  if (daysLeft <= 0) {
    return { code: 'expired', status: 'Expired', daysLeft };
  }

  if (daysLeft <= 5) {
    return { code: 'warning', status: 'Warning', daysLeft };
  }

  return { code: 'paid', status: 'Paid', daysLeft };
};

const buildPaymentTrackingRows = ({ students = [], payments = [], transportRecords = [], today = new Date() } = {}) => {
  const latestByStudent = new Map();

  for (const payment of payments) {
    const key = String(payment.studentId || '').trim();
    if (!key) continue;

    const previous = latestByStudent.get(key);
    const currentPaymentDate = new Date(payment.paymentDate || 0).getTime();
    const previousPaymentDate = previous ? new Date(previous.paymentDate || 0).getTime() : -Infinity;

    if (!previous || currentPaymentDate > previousPaymentDate) {
      latestByStudent.set(key, payment);
    }
  }

  const transportLookup = new Map();
  for (const transport of transportRecords) {
    const studentRef = transport.studentId;
    const keys = [
      getTransportMatchKey(studentRef),
      getTransportMatchKey(transport.studentId && typeof transport.studentId === 'object' ? transport.studentId.toString() : transport.studentId),
      getTransportMatchKey(transport.studentId && typeof transport.studentId === 'object' ? transport.studentId._id : undefined)
    ].filter(Boolean);

    for (const key of keys) {
      if (!transportLookup.has(key)) {
        transportLookup.set(key, transport);
      }
    }
  }

  return students.map((student, index) => {
    const studentKey = String(student.studentId || student._id || '').trim();
    const studentObjectId = student._id ? String(student._id) : '';
    const payment = latestByStudent.get(studentKey) || latestByStudent.get(String(student._id || '')) || null;
    const transport = transportLookup.get(studentKey) || transportLookup.get(studentObjectId) || null;
    const dueDate = payment?.dueDate || student?.dueDate || null;
    const remainingBalance = Number(payment?.remainingBalance ?? student?.monthlyTuition ?? 0);
    const tuitionAmount = Number(payment?.tuitionAmount ?? student?.monthlyTuition ?? 0);
    const discount = Number(payment?.discount ?? 0);
    const totalAmount = Number(payment?.amount ?? Math.max(tuitionAmount - discount, 0));
    const paymentPlan = payment?.paymentPlan || payment?.paymentType || 'monthly';
    const paymentDurationMonths = getPlanDurationMonths(paymentPlan);
    const monthlyRouteFee = Number(transport?.monthlyFee || 0);
    const transportCharge = monthlyRouteFee * paymentDurationMonths;
    const { englishName, khmerName } = splitFullName(student.fullName || payment?.studentName || '');
    const { code, status, daysLeft } = buildTrackingStatus({ dueDate, remainingBalance, today });

    return {
      rowNumber: index + 1,
      studentId: student.studentId || student._id || '',
      fullName: student.fullName || '',
      englishName,
      khmerName,
      route: transport?.routeName || '',
      vehicle: transport?.vehicleNumber || '',
      monthlyRouteFee,
      transportCharge,
      gender: student.gender || '',
      phone: student.phone || '',
      paymentStartDate: payment?.paymentDate || '',
      paymentDurationMonths,
      dueDate: dueDate || '',
      tuitionAmount: tuitionAmount || 0,
      discount,
      totalAmount,
      daysLeft,
      status,
      statusCode: code,
      room: student.room || '',
      session: normalizeSession(student.studyShift || payment?.studyShift || ''),
      className: student.className || payment?.className || '',
      academicYear: student.academicYear || payment?.academicYear || '',
      paymentPlan,
      remainingBalance,
      note: payment?.remarks || ''
    };
  });
};

const summarizeTrackingRows = (rows = []) => {
  const summary = {
    totalStudents: rows.length,
    paid: 0,
    warning: 0,
    expired: 0,
    sessions: {},
    rooms: {},
    totalTuition: 0,
    totalDiscount: 0,
    totalPaid: 0
  };

  rows.forEach((row) => {
    const statusLabel = row.status || 'Paid';
    if (statusLabel === 'Paid') summary.paid += 1;
    if (statusLabel === 'Warning') summary.warning += 1;
    if (statusLabel === 'Expired') summary.expired += 1;

    const session = row.session || 'Unknown';
    summary.sessions[session] = (summary.sessions[session] || 0) + 1;

    const room = row.room || 'Unknown';
    summary.rooms[room] = (summary.rooms[room] || 0) + 1;

    summary.totalTuition += Number(row.tuitionAmount || 0);
    summary.totalDiscount += Number(row.discount || 0);
    summary.totalPaid += Number(row.totalAmount || 0);
  });

  return summary;
};

const getPaymentTrackingReport = async (filters = {}) => {
  const search = String(filters.search || '').trim();
  const session = String(filters.session || '').trim();
  const room = String(filters.room || '').trim();
  const status = String(filters.status || '').trim().toLowerCase();
  const plan = String(filters.plan || '').trim();
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;

  const page = Number(filters.page) || 1;
  const limit = Number(filters.perPage) || 25;

  const studentQuery = {};

  if (search) {
    const safeSearch = escapeRegex(search);
    studentQuery.$or = [
      { studentId: new RegExp(safeSearch, 'i') },
      { fullName: new RegExp(safeSearch, 'i') },
      { phone: new RegExp(safeSearch, 'i') }
    ];
  }

  if (session) {
    studentQuery.studyShift = new RegExp(`^${escapeRegex(session)}$`, 'i');
  }

  if (room) {
    studentQuery.room = new RegExp(`^${escapeRegex(room)}$`, 'i');
  }

  const [students, allStudentCount] = await Promise.all([
    Student.find(studentQuery).sort({ fullName: 1 }).lean(),
    Student.countDocuments(studentQuery)
  ]);

  const studentIds = students.map((student) => String(student.studentId || student._id || '').trim()).filter(Boolean);
  const studentObjectIds = students
    .map((student) => student._id)
    .filter((studentId) => mongoose.Types.ObjectId.isValid(studentId));

  const paymentQuery = {};
  if (studentIds.length > 0) {
    paymentQuery.studentId = { $in: studentIds };
  }

  if (plan) {
    paymentQuery.paymentPlan = new RegExp(`^${escapeRegex(plan)}$`, 'i');
  }

  if (from || to) {
    paymentQuery.dueDate = {};
    if (from) paymentQuery.dueDate.$gte = new Date(from);
    if (to) paymentQuery.dueDate.$lte = new Date(to);
  }

  const payments = await Payment.find(paymentQuery).sort({ paymentDate: -1 }).lean();

  const transportRecords = studentObjectIds.length > 0
    ? await Transport.find({ studentId: { $in: studentObjectIds } }).lean()
    : [];

  let rows = buildPaymentTrackingRows({ students, payments, transportRecords, today: new Date() });

  if (status) {
    rows = rows.filter((row) => {
      const rowStatus = row.status.toLowerCase();
      return rowStatus === status;
    });
  }

  const summary = summarizeTrackingRows(rows);

  const total = rows.length;
  const start = (page - 1) * limit;
  const paginatedRows = rows.slice(start, start + limit);

  return {
    items: paginatedRows,
    summary,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    },
    rawStudentCount: allStudentCount
  };
};

module.exports = {
  calculateDaysLeft,
  buildTrackingStatus,
  buildPaymentTrackingRows,
  summarizeTrackingRows,
  getPaymentTrackingReport
};
