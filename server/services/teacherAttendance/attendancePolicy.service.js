const { SchoolSetting } = require('../../models');
const { createAttendanceError } = require('./errors');
const { parseTimeToMinutes, getLocalMinutes, getSchoolTimezone } = require('./time.utils');

const SCHOOL_SETTINGS_KEY = 'school-settings';

const getDefaultSessionPolicy = () => ({
  checkInStart: '06:00',
  lateAfter: '08:00',
  checkoutTime: '18:00'
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
  morningCheckInStart: null,
  morningLateAfter: null,
  morningCheckoutTime: null,
  afternoonCheckInStart: null,
  afternoonLateAfter: null,
  afternoonCheckoutTime: null,
  eveningCheckInStart: null,
  eveningLateAfter: null,
  eveningCheckoutTime: null
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
      checkInStart: policy.morningCheckInStart || policy.attendanceStart || '06:00',
      checkInEnd: policy.morningCheckInEnd || policy.attendanceEnd || '18:00',
      lateAfter: policy.morningLateAfter || policy.attendanceLateAfter || '08:00',
      checkoutTime: policy.morningCheckoutTime || policy.attendanceEnd || '18:00'
    },
    afternoon: {
      checkInStart: policy.afternoonCheckInStart || policy.attendanceStart || '06:00',
      checkInEnd: policy.afternoonCheckInEnd || policy.attendanceEnd || '18:00',
      lateAfter: policy.afternoonLateAfter || policy.attendanceLateAfter || '08:00',
      checkoutTime: policy.afternoonCheckoutTime || policy.attendanceEnd || '18:00'
    },
    evening: {
      checkInStart: policy.eveningCheckInStart || policy.attendanceStart || '06:00',
      checkInEnd: policy.eveningCheckInEnd || policy.attendanceEnd || '18:00',
      lateAfter: policy.eveningLateAfter || policy.attendanceLateAfter || '08:00',
      checkoutTime: policy.eveningCheckoutTime || policy.attendanceEnd || '18:00'
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
