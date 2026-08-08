const { createAttendancePolicyService, getDefaultPolicy } = require('./attendancePolicy.service');
const { createGpsDistanceService } = require('./gpsDistance.service');
const { createQrTokenValidationService } = require('./qrTokenValidation.service');
const { createDuplicatePreventionService } = require('./duplicatePrevention.service');
const { createLateCalculationService } = require('./lateCalculation.service');
const { createAttendanceStatusService } = require('./attendanceStatus.service');
const { createCheckInValidationService } = require('./checkInValidation.service');
const { createCheckOutValidationService } = require('./checkOutValidation.service');
const { createAttendanceHistoryQueryService } = require('./attendanceHistoryQuery.service');
const { createTodayAttendanceSummaryService } = require('./todayAttendanceSummary.service');

const createTeacherAttendanceServices = (deps = {}) => {
  const policyService = createAttendancePolicyService(deps);
  const gpsDistanceService = createGpsDistanceService(deps);
  const qrTokenValidationService = createQrTokenValidationService(deps);
  const duplicatePreventionService = createDuplicatePreventionService(deps);
  const lateCalculationService = createLateCalculationService(deps);
  const attendanceStatusService = createAttendanceStatusService({ lateCalculationService, ...deps });
  const checkInValidationService = createCheckInValidationService({
    policyService,
    qrTokenValidationService,
    gpsDistanceService,
    duplicatePreventionService,
    attendanceStatusService,
    ...deps
  });
  const checkOutValidationService = createCheckOutValidationService({
    policyService,
    gpsDistanceService,
    duplicatePreventionService,
    attendanceStatusService,
    ...deps
  });
  const attendanceHistoryQueryService = createAttendanceHistoryQueryService(deps);
  const todayAttendanceSummaryService = createTodayAttendanceSummaryService(deps);

  return {
    policyService,
    gpsDistanceService,
    qrTokenValidationService,
    duplicatePreventionService,
    lateCalculationService,
    attendanceStatusService,
    checkInValidationService,
    checkOutValidationService,
    attendanceHistoryQueryService,
    todayAttendanceSummaryService
  };
};

module.exports = {
  createTeacherAttendanceServices,
  createAttendancePolicyService,
  createGpsDistanceService,
  createQrTokenValidationService,
  createDuplicatePreventionService,
  createLateCalculationService,
  createAttendanceStatusService,
  createCheckInValidationService,
  createCheckOutValidationService,
  createAttendanceHistoryQueryService,
  createTodayAttendanceSummaryService,
  getDefaultPolicy
};
