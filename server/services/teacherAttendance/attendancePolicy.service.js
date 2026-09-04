const { SchoolSetting } = require('../../models');
const { createAttendanceError } = require('./errors');
const { parseTimeToMinutes, getLocalMinutes, getSchoolTimezone } = require('./time.utils');

const SCHOOL_SETTINGS_KEY = 'school-settings';

const SESSION_DEFAULTS = {
  morning: { checkInStart: '06:45', checkInEnd: '10:45', lateAfter: '06:50' },
  afternoon: { checkInStart: '12:30', checkInEnd: '16:00', lateAfter: '12:35' },
  evening: { checkInStart: '18:00', checkInEnd: '20:00', lateAfter: '18:05' }
};

const getDefaultSessionPolicy = () => ({
  ...SESSION_DEFAULTS.morning,
  checkoutTime: '10:45'
});

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
  attendanceQrRotationSeconds: 30,
  morningCheckInStart: '06:45',
  morningCheckInEnd: '10:45',
  morningLateAfter: '06:50',
  morningCheckoutTime: '10:45',
  afternoonCheckInStart: '12:30',
  afternoonCheckInEnd: '16:00',
  afternoonLateAfter: '12:35',
  afternoonCheckoutTime: '16:00',
  eveningCheckInStart: '18:00',
  eveningCheckInEnd: '20:00',
  eveningLateAfter: '18:05',
  eveningCheckoutTime: '20:00'
});

const normalizeSessionType = (sessionType) => {
  const value = String(sessionType || 'morning').trim().toLowerCase();
  if (value === 'morning' || value === 'afternoon' || value === 'evening') {
    return value;
  }
  return 'morning';
};

const getSessionPolicy = (policy, sessionType = 'morning') => {
  const normalized = normalizeSessionType(sessionType);
  const configMap = {
    morning: {
      checkInStart: policy.morningCheckInStart || SESSION_DEFAULTS.morning.checkInStart,
      checkInEnd: policy.morningCheckInEnd || SESSION_DEFAULTS.morning.checkInEnd,
      lateAfter: policy.morningLateAfter || SESSION_DEFAULTS.morning.lateAfter,
      checkoutTime: policy.morningCheckoutTime || SESSION_DEFAULTS.morning.checkInEnd
    },
    afternoon: {
      checkInStart: policy.afternoonCheckInStart || SESSION_DEFAULTS.afternoon.checkInStart,
      checkInEnd: policy.afternoonCheckInEnd || SESSION_DEFAULTS.afternoon.checkInEnd,
      lateAfter: policy.afternoonLateAfter || SESSION_DEFAULTS.afternoon.lateAfter,
      checkoutTime: policy.afternoonCheckoutTime || SESSION_DEFAULTS.afternoon.checkInEnd
    },
    evening: {
      checkInStart: policy.eveningCheckInStart || SESSION_DEFAULTS.evening.checkInStart,
      checkInEnd: policy.eveningCheckInEnd || SESSION_DEFAULTS.evening.checkInEnd,
      lateAfter: policy.eveningLateAfter || SESSION_DEFAULTS.evening.lateAfter,
      checkoutTime: policy.eveningCheckoutTime || SESSION_DEFAULTS.evening.checkInEnd
    }
  };

  return {
    ...getDefaultSessionPolicy(),
    ...configMap[normalized]
  };
};

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

  const ensureWithinAttendanceWindow = (policy, referenceTime = nowProvider(), sessionType = 'morning', enforceEnd = true) => {
    const sessionPolicy = getSessionPolicy(policy, sessionType);
    const startMinutes = parseTimeToMinutes(sessionPolicy.checkInStart);
    const endMinutes = parseTimeToMinutes(sessionPolicy.checkInEnd);
    if (startMinutes === null || endMinutes === null) {
      throw createAttendanceError('INVALID_POLICY', 'Attendance policy time format is invalid', 500);
    }

    const currentMinutes = getLocalMinutes(referenceTime, policy.attendanceTimezone || getSchoolTimezone());
    if (currentMinutes < startMinutes) {
      throw createAttendanceError('OUTSIDE_ATTENDANCE_WINDOW', 'Current time is outside attendance window', 422);
    }
    if (enforceEnd && currentMinutes >= endMinutes) {
      throw createAttendanceError('OUTSIDE_ATTENDANCE_WINDOW', 'Current time is outside attendance window', 422);
    }
  };

  return {
    getPolicy,
    getSessionPolicy,
    ensureAttendanceEnabled,
    ensureMethodEnabled,
    ensureGpsEnabled,
    ensureWithinAttendanceWindow,
    getDefaultPolicy,
    normalizeSessionType
  };
};

module.exports = {
  createAttendancePolicyService,
  getDefaultPolicy,
  getDefaultSessionPolicy,
  getSessionPolicy,
  normalizeSessionType,
  SCHOOL_SETTINGS_KEY
};
