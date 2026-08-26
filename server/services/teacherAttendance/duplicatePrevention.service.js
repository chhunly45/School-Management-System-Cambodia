const { TeacherAttendance } = require('../../models');
const { createAttendanceError } = require('./errors');

const normalizeSessionType = (sessionType) => {
  const value = String(sessionType || '').trim().toLowerCase();
  if (['morning', 'afternoon', 'evening'].includes(value)) return value;
  return null;
};

const createDuplicatePreventionService = ({ TeacherAttendanceModel = TeacherAttendance } = {}) => {
  const findExistingDailyAttendance = async ({ teacherId, attendanceDate }) => TeacherAttendanceModel.findOne({
    teacherId,
    attendanceDate,
    isDeleted: false
  });

  const findExistingSessionAttendance = async ({ teacherId, attendanceDate, sessionType }) => {
    const normalized = normalizeSessionType(sessionType);
    const query = {
      teacherId,
      attendanceDate,
      isDeleted: false
    };

    if (normalized) {
      query.$or = normalized === 'morning'
        ? [
          { sessionType: normalized },
          { sessionType: null },
          { sessionType: { $exists: false } }
        ]
        : [{ sessionType: normalized }];
    } else {
      query.$or = [{ sessionType: null }, { sessionType: { $exists: false } }];
    }

    return TeacherAttendanceModel.findOne(query).sort({ createdAt: -1 });
  };

  const ensureNoExistingCheckIn = async ({ teacherId, attendanceDate, sessionType = 'morning' }) => {
    const existing = await findExistingSessionAttendance({ teacherId, attendanceDate, sessionType });
    if (!existing) return null;

    if (existing.checkOutTime) {
      throw createAttendanceError('ALREADY_CHECKED_OUT', 'Teacher has already checked out for this session', 409);
    }

    throw createAttendanceError('ALREADY_CHECKED_IN', 'Teacher has already checked in for this session', 409);
  };

  const ensureCanCheckOut = async ({ teacherId, attendanceDate, sessionType = 'morning' }) => {
    const existing = await findExistingSessionAttendance({ teacherId, attendanceDate, sessionType });
    if (!existing || !existing.checkInTime) {
      throw createAttendanceError('NOT_CHECKED_IN', 'Teacher has not checked in for this session yet', 409);
    }
    if (existing.checkOutTime) {
      throw createAttendanceError('ALREADY_CHECKED_OUT', 'Teacher has already checked out for this session', 409);
    }
    return existing;
  };

  return {
    findExistingDailyAttendance,
    findExistingSessionAttendance,
    ensureNoExistingCheckIn,
    ensureCanCheckOut
  };
};

module.exports = {
  createDuplicatePreventionService
};
