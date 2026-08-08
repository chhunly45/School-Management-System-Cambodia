const { TeacherAttendance, Teacher } = require('../../models');
const { normalizeToDayStart, addDays } = require('./time.utils');

const createTodayAttendanceSummaryService = ({
  TeacherAttendanceModel = TeacherAttendance,
  TeacherModel = Teacher,
  nowProvider = () => new Date()
} = {}) => {
  const getTodaySummary = async ({ referenceDate = nowProvider() } = {}) => {
    const dayStart = normalizeToDayStart(referenceDate);
    const dayEnd = addDays(dayStart, 1);

    const match = {
      attendanceDate: { $gte: dayStart, $lt: dayEnd },
      isDeleted: false
    };

    const [statusTotals, checkInCount, checkOutCount, totalActiveTeachers] = await Promise.all([
      TeacherAttendanceModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', total: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', total: 1 } }
      ]),
      TeacherAttendanceModel.countDocuments({ ...match, checkInTime: { $ne: null } }),
      TeacherAttendanceModel.countDocuments({ ...match, checkOutTime: { $ne: null } }),
      TeacherModel.countDocuments({ status: 'active' })
    ]);

    const statusMap = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
    statusTotals.forEach((item) => {
      if (statusMap[item.status] !== undefined) {
        statusMap[item.status] = item.total;
      }
    });

    const attendedCount = statusMap.PRESENT + statusMap.LATE + statusMap.LEAVE;
    const calculatedAbsent = Math.max(totalActiveTeachers - attendedCount, 0);

    return {
      date: dayStart,
      totalActiveTeachers,
      checkedIn: checkInCount,
      checkedOut: checkOutCount,
      byStatus: {
        PRESENT: statusMap.PRESENT,
        LATE: statusMap.LATE,
        ABSENT: Math.max(statusMap.ABSENT, calculatedAbsent),
        LEAVE: statusMap.LEAVE
      }
    };
  };

  return {
    getTodaySummary
  };
};

module.exports = {
  createTodayAttendanceSummaryService
};
