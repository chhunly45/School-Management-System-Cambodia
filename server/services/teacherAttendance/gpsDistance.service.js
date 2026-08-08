const { createAttendanceError } = require('./errors');

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

const createGpsDistanceService = () => {
  const calculateDistanceMeters = ({ fromLatitude, fromLongitude, toLatitude, toLongitude }) => {
    const lat1 = Number(fromLatitude);
    const lon1 = Number(fromLongitude);
    const lat2 = Number(toLatitude);
    const lon2 = Number(toLongitude);

    if ([lat1, lon1, lat2, lon2].some((value) => Number.isNaN(value))) {
      throw createAttendanceError('GPS_INVALID', 'GPS coordinates are invalid', 422);
    }

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);
    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);

    const a = (Math.sin(deltaLat / 2) ** 2) +
      (Math.cos(rLat1) * Math.cos(rLat2) * (Math.sin(deltaLon / 2) ** 2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_METERS * c;
  };

  const validateInsideRadius = ({
    latitude,
    longitude,
    schoolLatitude,
    schoolLongitude,
    allowedRadiusMeters
  }) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw createAttendanceError('GPS_DENIED', 'GPS location is required', 422);
    }

    const distanceFromSchool = calculateDistanceMeters({
      fromLatitude: lat,
      fromLongitude: lng,
      toLatitude: schoolLatitude,
      toLongitude: schoolLongitude
    });

    if (distanceFromSchool > Number(allowedRadiusMeters || 0)) {
      throw createAttendanceError('OUTSIDE_RADIUS', 'Location is outside school radius', 422, {
        distanceFromSchool,
        allowedRadiusMeters
      });
    }

    return {
      distanceFromSchool
    };
  };

  return {
    calculateDistanceMeters,
    validateInsideRadius
  };
};

module.exports = {
  createGpsDistanceService,
  EARTH_RADIUS_METERS
};
