const { SchoolSetting } = require('../../models');
const { createAttendanceError } = require('./errors');
const { parseTimeToMinutes, getLocalMinutes } = require('./time.utils');

const SCHOOL_SETTINGS_KEY = 'school-settings';

const getDefaultPolicy = () => ({
  attendanceEnabled: true,
  attendanceQrEnabled: true,
  attendanceFaceEnabled: false,
  attendanceGpsEnabled: true,
  attendanceSchoolLatitude: null,
  attendanceSchoolLongitude: null,
  attendanceAllowedRadius: 100,
  attendanceLateAfter: '08:00',
  attendanceStart: '06:00',
  attendanceEnd: '18:00',
  attendanceQrRotationSeconds: 30
});

const createAttendancePolicyService = ({
  SchoolSettingModel = SchoolSetting,
  nowProvider = () => new Date(),
  singletonKey = SCHOOL_SETTINGS_KEY
} = {}) => {
  const getPolicy = async () => {
    const settings = await SchoolSettingModel.findOne({ singletonKey }).lean();
    return {
      ...getDefaultPolicy(),
      ...(settings || {})
    };
  };

  const ensureAttendanceEnabled = (policy) => {
    if (!policy.attendanceEnabled) {
      throw createAttendanceError('ATTENDANCE_DISABLED', 'Attendance is currently disabled', 403);
    }
  };

  const ensureMethodEnabled = (policy, attendanceMethod) => {
    if (attendanceMethod === 'QR' && !policy.attendanceQrEnabled) {
      throw createAttendanceError('QR_DISABLED', 'QR attendance is disabled', 403);
    }
    if (attendanceMethod === 'FACE' && !policy.attendanceFaceEnabled) {
      throw createAttendanceError('FACE_DISABLED', 'Face attendance is disabled', 403);
    }
  };

  const ensureGpsEnabled = (policy) => {
    if (!policy.attendanceGpsEnabled) {
      throw createAttendanceError('GPS_DISABLED', 'GPS attendance validation is disabled', 403);
    }
  };

  const ensureWithinAttendanceWindow = (policy, referenceTime = nowProvider()) => {
    const startMinutes = parseTimeToMinutes(policy.attendanceStart);
    const endMinutes = parseTimeToMinutes(policy.attendanceEnd);
    if (startMinutes === null || endMinutes === null) {
      throw createAttendanceError('INVALID_POLICY', 'Attendance policy time format is invalid', 500);
    }

    const currentMinutes = getLocalMinutes(referenceTime);
    const withinWindow = startMinutes <= endMinutes
      ? (currentMinutes >= startMinutes && currentMinutes <= endMinutes)
      : (currentMinutes >= startMinutes || currentMinutes <= endMinutes);

    if (!withinWindow) {
      throw createAttendanceError('OUTSIDE_ATTENDANCE_WINDOW', 'Current time is outside attendance window', 422);
    }
  };

  return {
    getPolicy,
    ensureAttendanceEnabled,
    ensureMethodEnabled,
    ensureGpsEnabled,
    ensureWithinAttendanceWindow,
    getDefaultPolicy
  };
};

module.exports = {
  createAttendancePolicyService,
  getDefaultPolicy,
  SCHOOL_SETTINGS_KEY
};
