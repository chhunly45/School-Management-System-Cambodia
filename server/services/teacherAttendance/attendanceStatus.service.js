const { createLateCalculationService } = require('./lateCalculation.service');

const createAttendanceStatusService = ({ lateCalculationService = createLateCalculationService() } = {}) => {
  const calculateCheckInStatus = ({ checkInTime, lateAfter }) => {
    const late = lateCalculationService.isLate({ checkInTime, lateAfter });
    return late ? 'LATE' : 'PRESENT';
  };

  const calculateFinalStatus = ({ existingStatus, checkOutTime }) => {
    if (!checkOutTime) return existingStatus;
    return existingStatus;
  };

  return {
    calculateCheckInStatus,
    calculateFinalStatus
  };
};

module.exports = {
  createAttendanceStatusService
};
