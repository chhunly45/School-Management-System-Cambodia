const { Student, Payment, Attendance, EmployeeAttendance, Certificate, Transport } = require('../models');
const { getSchoolDayBounds, getZonedParts } = require('../services/teacherAttendance/time.utils');

const toMoney = (value = 0) => Number(Number(value || 0).toFixed(2));

const getWeekStart = (date = new Date()) => {
  const now = new Date(date);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() + diff);
  return now;
};

const getMonthStart = (date = new Date()) => {
  const now = new Date(date);
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getTeacherPresenceToday = async (EmployeeAttendanceModel, todayStart, todayEnd) => {
  const teacherAttendanceRecords = await EmployeeAttendanceModel.countDocuments({
    date: { $gte: todayStart, $lt: todayEnd },
    employeeType: 'teacher'
  });

  if (!teacherAttendanceRecords) {
    return null;
  }

  return EmployeeAttendanceModel.countDocuments({
    date: { $gte: todayStart, $lt: todayEnd },
    employeeType: 'teacher',
    status: 'present'
  });
};

const getSchoolDateOrdinal = (date) => {
  const parts = getZonedParts(date);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day) / (24 * 60 * 60 * 1000);
};

const evaluatePaymentLifecycle = (payment, todayOrdinal) => {
  const remainingBalance = Number(payment.remainingBalance || 0);
  if (remainingBalance <= 0 || payment.status === 'paid') return 'paid';

  if (!payment.dueDate) return null;
  const dueDate = new Date(payment.dueDate);
  if (Number.isNaN(dueDate.getTime())) return null;

  const dueDateOrdinal = getSchoolDateOrdinal(dueDate);
  if (dueDateOrdinal === null) return null;
  const gracePeriodDays = Number(payment.gracePeriodDays || 0);
  const daysSinceDue = todayOrdinal - dueDateOrdinal;

  if (daysSinceDue <= 0) return 'due_soon';
  if (daysSinceDue <= gracePeriodDays) return 'grace_period';
  return 'overdue';
};

const createGetSchoolStats = ({
  models = { Student, Payment, Attendance, EmployeeAttendance, Certificate, Transport },
  nowProvider = () => new Date()
} = {}) => async (req, res, next) => {
  const {
    Student: StudentModel,
    Payment: PaymentModel,
    Attendance: AttendanceModel,
    EmployeeAttendance: EmployeeAttendanceModel,
    Certificate: CertificateModel,
    Transport: TransportModel
  } = models;
  try {
    const now = nowProvider();
    const { start: todayStart, end: todayEnd } = getSchoolDayBounds(now);
    const todayOrdinal = getSchoolDateOrdinal(now);
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    const [
      studentsPresentToday,
      studentsAbsentToday,
      teachersPresentToday,
      totalStudents,
      maleStudents,
      femaleStudents,
      todaysIncome,
      monthlyIncome,
      outstandingTuition,
      paymentLifecycleDocs,
      totalCertificates,
      totalTransport
    ] = await Promise.all([
      AttendanceModel.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'present' }),
      AttendanceModel.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'absent' }),
      getTeacherPresenceToday(EmployeeAttendanceModel, todayStart, todayEnd),
      StudentModel.countDocuments({ status: 'active' }),
      StudentModel.countDocuments({ status: 'active', gender: 'male' }),
      StudentModel.countDocuments({ status: 'active', gender: 'female' }),
      PaymentModel.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: todayStart, $lt: todayEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      PaymentModel.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: monthStart, $lte: now }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalIncome: { $sum: '$amount' }
          }
        }
      ]),
      PaymentModel.aggregate([
        {
          $match: {
            remainingBalance: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$remainingBalance' }
          }
        }
      ]),
      PaymentModel.find({ remainingBalance: { $gt: 0 } })
        .select('studentId status remainingBalance dueDate gracePeriodDays')
        .lean(),
      CertificateModel.countDocuments({ status: 'issued' }),
      TransportModel.countDocuments({ status: 'active' })
    ]);

    const todayIncome = todaysIncome[0]?.total || 0;
    const monthIncome = monthlyIncome[0]?.totalIncome || 0;
    const outstandingBalance = outstandingTuition[0]?.total || 0;

    const overdueStudentIds = new Set();
    const lifecycleSummary = paymentLifecycleDocs.reduce(
      (acc, payment) => {
        const lifecycle = evaluatePaymentLifecycle(payment, todayOrdinal);
        if (lifecycle === 'overdue' && payment.studentId) {
          overdueStudentIds.add(String(payment.studentId));
        } else if (lifecycle && acc[lifecycle] !== undefined) {
          acc[lifecycle] += 1;
        }
        return acc;
      },
      { due_soon: 0, grace_period: 0, overdue: 0 }
    );

    res.json({
      success: true,
      data: {
        studentsPresentToday,
        studentsAbsentToday,
        teachersPresentToday,
        totalStudents,
        maleStudents,
        femaleStudents,
        todaysIncome: toMoney(todayIncome),
        monthlyIncome: toMoney(monthIncome),
        outstandingTuition: toMoney(outstandingBalance),
        dueSoonPayments: lifecycleSummary.due_soon,
        gracePeriodPayments: lifecycleSummary.grace_period,
        overduePayments: overdueStudentIds.size,
        totalCertificates,
        totalTransport,
        recentPayments: [],
        recentStudents: []
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSchoolStats = createGetSchoolStats();

module.exports = {
  getSchoolStats,
  createGetSchoolStats
};
