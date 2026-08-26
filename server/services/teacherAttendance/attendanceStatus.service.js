const { createLateCalculationService } = require('./lateCalculation.service');
const { parseTimeToMinutes, getLocalMinutes } = require('./time.utils');

const createAttendanceStatusService = ({ lateCalculationService = createLateCalculationService() } = {}) => {
  const calculateCheckInStatus = ({ checkInTime, lateAfter }) => {
    const late = lateCalculationService.isLate({ checkInTime, lateAfter });
    return late ? 'LATE' : 'PRESENT';
  };

  const calculateFinalStatus = ({ existingStatus, checkOutTime, sessionCheckoutTime }) => {
    if (!checkOutTime) return existingStatus;
    if (!sessionCheckoutTime) return existingStatus;

    const checkoutMinutes = getLocalMinutes(checkOutTime);
    const normalCheckoutMinutes = parseTimeToMinutes(sessionCheckoutTime);
    if (normalCheckoutMinutes === null) return existingStatus;

    const isLegacyDailyDefault = sessionCheckoutTime === '18:00';
    if (!isLegacyDailyDefault && checkoutMinutes < normalCheckoutMinutes) {
      return 'LEAVE';
    }

    return existingStatus;
  };

  const calculateAbsentStatus = ({ checkInTime, referenceTime, sessionCheckoutTime }) => {
    if (checkInTime) return null;
    const checkoutMinutes = parseTimeToMinutes(sessionCheckoutTime);
    if (checkoutMinutes === null) return null;
    return getLocalMinutes(referenceTime) >= checkoutMinutes ? 'ABSENT' : null;
  };

  return {
    calculateCheckInStatus,
    calculateFinalStatus,
    calculateAbsentStatus
  };
};

module.exports = {
  createAttendanceStatusService
};
