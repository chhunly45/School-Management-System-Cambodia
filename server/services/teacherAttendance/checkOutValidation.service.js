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

  const validateCheckOut = async ({ actor, latitude, longitude, gpsAccuracy }) => {
    ensureLoggedInTeacher(actor);

    const policy = await policyService.getPolicy();
    const now = nowProvider();

    policyService.ensureAttendanceEnabled(policy);
    policyService.ensureWithinAttendanceWindow(policy, now);

    const attendanceDate = normalizeToDayStart(now);
    const attendance = await duplicatePreventionService.ensureCanCheckOut({
      teacherId: actor.teacherId,
      attendanceDate
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

    const nextStatus = attendanceStatusService.calculateFinalStatus({
      existingStatus: attendance.status,
      checkOutTime: now
    });

    return {
      attendance,
      attendanceDate,
      checkOutTime: now,
      status: nextStatus,
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      gpsAccuracy: gpsAccuracy === undefined ? null : Number(gpsAccuracy),
      distanceFromSchool,
      policy
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
