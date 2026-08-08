const { TeacherAttendance } = require('../../models');
const { createAttendanceError } = require('./errors');

const createDuplicatePreventionService = ({ TeacherAttendanceModel = TeacherAttendance } = {}) => {
  const findExistingDailyAttendance = async ({ teacherId, attendanceDate }) => TeacherAttendanceModel.findOne({
    teacherId,
    attendanceDate,
    isDeleted: false
  });

  const ensureNoExistingCheckIn = async ({ teacherId, attendanceDate }) => {
    const existing = await findExistingDailyAttendance({ teacherId, attendanceDate });
    if (!existing) return null;

    if (existing.checkOutTime) {
      throw createAttendanceError('ALREADY_CHECKED_OUT', 'Teacher has already checked out today', 409);
    }

    throw createAttendanceError('ALREADY_CHECKED_IN', 'Teacher has already checked in today', 409);
  };

  const ensureCanCheckOut = async ({ teacherId, attendanceDate }) => {
    const existing = await findExistingDailyAttendance({ teacherId, attendanceDate });
    if (!existing || !existing.checkInTime) {
      throw createAttendanceError('NOT_CHECKED_IN', 'Teacher has not checked in yet', 409);
    }
    if (existing.checkOutTime) {
      throw createAttendanceError('ALREADY_CHECKED_OUT', 'Teacher has already checked out today', 409);
    }
    return existing;
  };

  return {
    findExistingDailyAttendance,
    ensureNoExistingCheckIn,
    ensureCanCheckOut
  };
};

module.exports = {
  createDuplicatePreventionService
};
