const { parseTimeToMinutes, getLocalMinutes } = require('./time.utils');
const { createAttendanceError } = require('./errors');

const createLateCalculationService = () => {
  const isLate = ({ checkInTime, lateAfter }) => {
    const lateAfterMinutes = parseTimeToMinutes(lateAfter);
    if (lateAfterMinutes === null) {
      throw createAttendanceError('INVALID_POLICY', 'Late cutoff format is invalid', 500);
    }

    const checkInMinutes = getLocalMinutes(checkInTime);
    return checkInMinutes >= lateAfterMinutes;
  };

  return {
    isLate
  };
};

module.exports = {
  createLateCalculationService
};
