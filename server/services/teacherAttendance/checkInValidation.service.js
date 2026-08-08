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
    gpsAccuracy
  }) => {
    ensureLoggedInTeacher(actor);

    const policy = await policyService.getPolicy();
    const now = nowProvider();

    policyService.ensureAttendanceEnabled(policy);
    policyService.ensureMethodEnabled(policy, attendanceMethod);
    policyService.ensureWithinAttendanceWindow(policy, now);

    const attendanceDate = normalizeToDayStart(now);
    await duplicatePreventionService.ensureNoExistingCheckIn({
      teacherId: actor.teacherId,
      attendanceDate
    });

    let qrTokenDoc = null;
    if (attendanceMethod === 'QR') {
      qrTokenDoc = await qrTokenValidationService.validateToken(qrToken);
    }

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

    const status = attendanceStatusService.calculateCheckInStatus({
      checkInTime: now,
      lateAfter: policy.attendanceLateAfter
    });

    return {
      attendanceDate,
      checkInTime: now,
      attendanceMethod,
      status,
      qrTokenId: qrTokenDoc ? qrTokenDoc._id : null,
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      gpsAccuracy: gpsAccuracy === undefined ? null : Number(gpsAccuracy),
      distanceFromSchool,
      policy
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
