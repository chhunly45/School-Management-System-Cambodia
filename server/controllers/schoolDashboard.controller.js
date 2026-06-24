const { Student, Teacher, Payment, Attendance, Certificate, Transport } = require('../models');

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

const getSchoolStats = async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    const [
      totalStudents,
      totalTeachers,
      monthlyPayments,
      weeklyAttendance,
      totalCertificates,
      totalTransport,
      recentPayments,
      recentStudents
    ] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Teacher.countDocuments({ status: 'active' }),
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
            total: { $sum: '$amount' }
          }
        }
      ]),
      Attendance.aggregate([
        {
          $match: {
            date: { $gte: weekStart, $lte: now }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
              }
            }
          }
        }
      ]),
      Certificate.countDocuments({ status: 'issued' }),
      Transport.countDocuments({ status: 'active' }),
      Payment.find({ status: 'paid' })
        .sort({ paymentDate: -1, createdAt: -1 })
        .limit(5)
        .select('receiptNumber studentId studentName className amount paymentDate paymentMethod status')
        .lean(),
      Student.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('studentId fullName className status createdAt')
        .lean()
    ]);

    const totalPayments = monthlyPayments[0]?.total || 0;
    const attendanceSummary = weeklyAttendance[0] || { total: 0, present: 0 };
    const attendanceRate = attendanceSummary.total
      ? Number(((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalPayments,
        attendanceRate,
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
