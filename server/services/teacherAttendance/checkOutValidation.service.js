const { createAttendanceError } = require('./errors');
const { normalizeToDayStart } = require('./time.utils');
const { createAttendancePolicyService } = require('./attendancePolicy.service');
const { createGpsDistanceService } = require('./gpsDistance.service');
const { createDuplicatePreventionService } = require('./duplicatePrevention.service');
const { createAttendanceStatusService } = require('./attendanceStatus.service');

const createCheckOutValidationService = ({
  policyService = createAttendancePolicyService(),
  gpsDistanceService = createGpsDistanceService(),
  duplicatePreventionService = createDuplicatePreventionService(),
  attendanceStatusService = createAttendanceStatusService(),
  nowProvider = () => new Date()
} = {}) => {
  const ensureLoggedInTeacher = (actor) => {
    if (!actor || !actor.userId || !actor.teacherId) {
      throw createAttendanceError('SESSION_EXPIRED', 'Teacher session is invalid or expired', 401);
    }
  };

  const validateCheckOut = async ({ actor, latitude, longitude, gpsAccuracy, sessionType = 'morning' }) => {
    ensureLoggedInTeacher(actor);

    const policy = await policyService.getPolicy();
    const now = nowProvider();
    const normalizedSessionType = policyService.normalizeSessionType ? policyService.normalizeSessionType(sessionType) : sessionType;

    policyService.ensureAttendanceEnabled(policy);
    policyService.ensureWithinAttendanceWindow(policy, now, normalizedSessionType, false);

    const attendanceDate = normalizeToDayStart(now);
    const attendance = await duplicatePreventionService.ensureCanCheckOut({
      teacherId: actor.teacherId,
      attendanceDate,
      sessionType: normalizedSessionType
    });

    let distanceFromSchool = null;
    if (policy.attendanceGpsEnabled) {
      const gpsResult = gpsDistanceService.validateInsideRadius({
        latitude,
        longitude,
        schoolLatitude: policy.attendanceSchoolLatitude,
        schoolLongitude: policy.attendanceSchoolLongitude,
        allowedRadiusMeters: policy.attendanceAllowedRadius
      });
      distanceFromSchool = gpsResult.distanceFromSchool;
    }

    const sessionPolicy = policyService.getSessionPolicy ? policyService.getSessionPolicy(policy, normalizedSessionType) : { checkoutTime: policy.attendanceEnd };
    const nextStatus = attendanceStatusService.calculateFinalStatus({
      existingStatus: attendance.status,
      checkOutTime: now,
      sessionCheckoutTime: sessionPolicy.checkoutTime
    });

    return {
      attendance,
      attendanceDate,
      sessionType: normalizedSessionType,
      checkOutTime: now,
      status: nextStatus,
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      gpsAccuracy: gpsAccuracy === undefined ? null : Number(gpsAccuracy),
      distanceFromSchool,
      policy,
      sessionPolicy
    };
  };

  return {
    validateCheckOut,
    ensureLoggedInTeacher
  };
};

module.exports = {
  createCheckOutValidationService
};
