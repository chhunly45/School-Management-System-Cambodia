const { TeacherAttendance } = require('../../models');
const { normalizeToDayStart, addDays } = require('./time.utils');

const MAX_PER_PAGE = 100;

const createAttendanceHistoryQueryService = ({ TeacherAttendanceModel = TeacherAttendance } = {}) => {
  const queryHistory = async ({
    teacherId,
    userId,
    fromDate,
    toDate,
    status,
    attendanceMethod,
    page = 1,
    perPage = 20
  } = {}) => {
    const query = { isDeleted: false };

    if (teacherId) query.teacherId = teacherId;
    if (userId) query.userId = userId;
    if (status) query.status = String(status).trim().toUpperCase();
    if (attendanceMethod) query.attendanceMethod = String(attendanceMethod).trim().toUpperCase();

    if (fromDate || toDate) {
      const start = fromDate ? normalizeToDayStart(fromDate) : new Date(0);
      const end = toDate ? addDays(normalizeToDayStart(toDate), 1) : new Date('9999-12-31T23:59:59.999Z');
      query.attendanceDate = { $gte: start, $lt: end };
    }

    const normalizedPage = Math.max(Number(page) || 1, 1);
    const normalizedPerPage = Math.min(Math.max(Number(perPage) || 20, 1), MAX_PER_PAGE);
    const skip = (normalizedPage - 1) * normalizedPerPage;

    const [items, total] = await Promise.all([
      TeacherAttendanceModel.find(query)
        .sort({ attendanceDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(normalizedPerPage)
        .lean(),
      TeacherAttendanceModel.countDocuments(query)
    ]);

    return {
      items,
      meta: {
        page: normalizedPage,
        limit: normalizedPerPage,
        total
      }
    };
  };

  return {
    queryHistory
  };
};

module.exports = {
  createAttendanceHistoryQueryService
};
