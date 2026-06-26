const { Student, Payment, Attendance, EmployeeAttendance, Certificate, Transport } = require('../models');

const toMoney = (value = 0) => Number(Number(value || 0).toFixed(2));

const getDayStart = (date = new Date()) => {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  return current;
};

const getDayEnd = (date = new Date()) => {
  const current = getDayStart(date);
  current.setDate(current.getDate() + 1);
  return current;
};

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

const getTeacherPresenceToday = async (todayStart, todayEnd) => {
  const teacherAttendanceRecords = await EmployeeAttendance.countDocuments({
    date: { $gte: todayStart, $lt: todayEnd },
    employeeType: 'teacher'
  });

  if (!teacherAttendanceRecords) {
    return null;
  }

  return EmployeeAttendance.countDocuments({
    date: { $gte: todayStart, $lt: todayEnd },
    employeeType: 'teacher',
    status: 'present'
  });
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const evaluatePaymentLifecycle = (payment, now = new Date()) => {
  const remainingBalance = Number(payment.remainingBalance || 0);
  if (remainingBalance <= 0) return 'paid';

  const dueDate = parseDateOnly(payment.dueDate);
  if (!dueDate) return 'overdue';

  const gracePeriodDays = Number(payment.gracePeriodDays || 0);
  const currentDate = parseDateOnly(now) || now;
  const graceStart = addDays(dueDate, 1);
  const graceEnd = addDays(dueDate, gracePeriodDays);

  if (currentDate < graceStart) return 'due_soon';
  if (currentDate >= graceStart && currentDate <= graceEnd) return 'grace_period';
  return 'overdue';
};

const getSchoolStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = getDayStart(now);
    const todayEnd = getDayEnd(now);
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    const [
      studentsPresentToday,
      studentsAbsentToday,
      teachersPresentToday,
      todaysIncome,
      monthlyIncome,
      outstandingTuition,
      paymentLifecycleDocs,
      recentPayments,
      recentStudents,
      totalCertificates,
      totalTransport
    ] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'present' }),
      Attendance.countDocuments({ date: { $gte: todayStart, $lt: todayEnd }, status: 'absent' }),
      getTeacherPresenceToday(todayStart, todayEnd),
      Payment.aggregate([
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
      Payment.aggregate([
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
      Payment.aggregate([
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
      Payment.find({ remainingBalance: { $gt: 0 } })
        .select('remainingBalance dueDate gracePeriodDays')
        .lean(),
      Payment.find({ status: 'paid' })
        .sort({ paymentDate: -1, createdAt: -1 })
        .limit(5)
        .select('receiptNumber studentId studentName className amount paymentDate paymentMethod status')
        .lean(),
      Student.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('studentId fullName className status createdAt')
        .lean(),
      Certificate.countDocuments({ status: 'issued' }),
      Transport.countDocuments({ status: 'active' })
    ]);

    const todayIncome = todaysIncome[0]?.totalIncome || 0;
    const monthIncome = monthlyIncome[0]?.totalIncome || 0;
    const outstandingBalance = outstandingTuition[0]?.total || 0;

    const lifecycleSummary = paymentLifecycleDocs.reduce(
      (acc, payment) => {
        const lifecycle = evaluatePaymentLifecycle(payment, now);
        if (acc[lifecycle] !== undefined) {
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
        todaysIncome: toMoney(todayIncome),
        monthlyIncome: toMoney(monthIncome),
        outstandingTuition: toMoney(outstandingBalance),
        dueSoonPayments: lifecycleSummary.due_soon,
        gracePeriodPayments: lifecycleSummary.grace_period,
        overduePayments: lifecycleSummary.overdue,
        totalCertificates,
        totalTransport,
        recentPayments,
        recentStudents
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchoolStats
};
