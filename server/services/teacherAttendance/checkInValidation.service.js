const { createAttendanceError } = require('./errors');
const { normalizeToDayStart } = require('./time.utils');
const { createAttendancePolicyService } = require('./attendancePolicy.service');
const { createQrTokenValidationService } = require('./qrTokenValidation.service');
const { createGpsDistanceService } = require('./gpsDistance.service');
const { createDuplicatePreventionService } = require('./duplicatePrevention.service');
const { createAttendanceStatusService } = require('./attendanceStatus.service');

const createCheckInValidationService = ({
  policyService = createAttendancePolicyService(),
  qrTokenValidationService = createQrTokenValidationService(),
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

  const validateCheckIn = async ({
    actor,
    attendanceMethod = 'QR',
    qrToken,
    latitude,
    longitude,
    gpsAccuracy,
    sessionType = 'morning'
  }) => {
    ensureLoggedInTeacher(actor);

    const policy = await policyService.getPolicy();
    const now = nowProvider();
    let normalizedSessionType = policyService.normalizeSessionType ? policyService.normalizeSessionType(sessionType) : sessionType;

    policyService.ensureAttendanceEnabled(policy);
    policyService.ensureMethodEnabled(policy, attendanceMethod);
    let qrTokenDoc = null;
    if (attendanceMethod === 'QR') {
      qrTokenDoc = await qrTokenValidationService.validateToken(qrToken);
      if (qrTokenDoc.sessionType) {
        normalizedSessionType = policyService.normalizeSessionType(qrTokenDoc.sessionType);
      }
    }

    policyService.ensureWithinAttendanceWindow(policy, now, normalizedSessionType);

    const attendanceDate = normalizeToDayStart(now);
    await duplicatePreventionService.ensureNoExistingCheckIn({
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

    const sessionPolicy = policyService.getSessionPolicy ? policyService.getSessionPolicy(policy, normalizedSessionType) : { lateAfter: policy.attendanceLateAfter };
    const status = attendanceStatusService.calculateCheckInStatus({
      checkInTime: now,
      lateAfter: sessionPolicy.lateAfter
    });

    return {
      attendanceDate,
      sessionType: normalizedSessionType,
      checkInTime: now,
      attendanceMethod,
      status,
      qrTokenId: qrTokenDoc ? qrTokenDoc.doc._id : null,
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      gpsAccuracy: gpsAccuracy === undefined ? null : Number(gpsAccuracy),
      distanceFromSchool,
      policy,
      sessionPolicy
    };
  };

  return {
    validateCheckIn,
    ensureLoggedInTeacher
  };
};

module.exports = {
  createCheckInValidationService
};
