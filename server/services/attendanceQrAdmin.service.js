const crypto = require('crypto');
const { AttendanceQrToken, SchoolSetting } = require('../models');
const { getDefaultPolicy, getSessionPolicy, SCHOOL_SETTINGS_KEY } = require('./teacherAttendance/attendancePolicy.service');
const { parseTimeToMinutes, getSchoolDayBounds, getSchoolTimezone, getZonedParts, zonedDateTimeToUtc } = require('./teacherAttendance/time.utils');

const ATTENDANCE_SESSIONS = ['morning', 'afternoon', 'evening'];

const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createAttendanceQrAdminService = ({
  AttendanceQrTokenModel = AttendanceQrToken,
  SchoolSettingModel = SchoolSetting,
  nowProvider = () => new Date(),
  settingsKey = SCHOOL_SETTINGS_KEY
} = {}) => {
  const buildQrPayload = (token, sessionType = null) => JSON.stringify({ token, ...(sessionType ? { sessionType } : {}) });

  const normalizeSessionType = (sessionType) => {
    const value = String(sessionType || '').trim().toLowerCase();
    return ATTENDANCE_SESSIONS.includes(value) ? value : null;
  };

  const getPolicy = async () => {
    const settings = await SchoolSettingModel.findOne({ singletonKey: settingsKey })
      .select('attendanceStart attendanceEnd attendanceTimezone morningCheckInEnd afternoonCheckInEnd eveningCheckInEnd morningCheckoutTime afternoonCheckoutTime eveningCheckoutTime')
      .lean();
    return { ...getDefaultPolicy(), ...(settings || {}) };
  };

  const getDailyExpiry = async (sessionType, referenceTime) => {
    const policy = await getPolicy();
    const sessionPolicy = getSessionPolicy(policy, sessionType || 'morning');
    const endMinutes = parseTimeToMinutes(sessionPolicy.checkInEnd || sessionPolicy.checkoutTime);
    if (endMinutes === null) {
      throw createValidationError('Attendance policy time format is invalid.', 500);
    }
    const timezone = policy.attendanceTimezone || getSchoolTimezone();
    const localDate = getZonedParts(referenceTime, timezone);
    const sessionEnd = zonedDateTimeToUtc({ ...localDate, hour: Math.floor(endMinutes / 60), minute: endMinutes % 60, second: 0 }, timezone);
    const midnightParts = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + 1));
    const midnight = zonedDateTimeToUtc({ year: midnightParts.getUTCFullYear(), month: midnightParts.getUTCMonth() + 1, day: midnightParts.getUTCDate() }, timezone);
    const expiresAt = sessionEnd < midnight ? sessionEnd : midnight;
    return {
      expiresAt,
      ttlSeconds: Math.max(0, Math.floor((expiresAt.getTime() - referenceTime.getTime()) / 1000))
    };
  };

  const formatToken = (doc, referenceTime = nowProvider()) => {
    if (!doc) return null;

    const expiresAt = new Date(doc.expiresAt);
    const now = referenceTime instanceof Date ? referenceTime : new Date(referenceTime);
    const status = doc.isRevoked
      ? 'REVOKED'
      : expiresAt.getTime() <= now.getTime()
        ? 'EXPIRED'
        : 'ACTIVE';

    return {
      id: String(doc._id),
      token: doc.token,
      rotationNumber: doc.rotationNumber,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      isRevoked: doc.isRevoked,
      revokedAt: doc.revokedAt,
      createdBy: doc.createdBy ? String(doc.createdBy) : null,
      status,
      sessionType: doc.sessionType || null,
      qrPayloadFormat: doc.sessionType ? 'json-token-session-v1' : 'json-token-v1',
      qrPayload: buildQrPayload(doc.token, doc.sessionType)
    };
  };

  const getActiveFilter = (referenceTime = nowProvider(), sessionType, schoolDay) => ({
    isRevoked: false,
    expiresAt: { $gt: referenceTime },
    ...(sessionType ? { sessionType: normalizeSessionType(sessionType) } : {}),
    ...(schoolDay ? { createdAt: { $gte: schoolDay.start, $lt: schoolDay.end } } : {})
  });

  const getCurrentActiveDoc = async (referenceTime = nowProvider(), sessionType) => {
    const schoolDay = getSchoolDayBounds(referenceTime, getSchoolTimezone());
    return AttendanceQrTokenModel.findOne(getActiveFilter(referenceTime, sessionType, schoolDay))
      .sort({ createdAt: -1, rotationNumber: -1 });
  };

  const getNextRotationNumber = async () => {
    const latest = await AttendanceQrTokenModel.findOne({}).sort({ rotationNumber: -1 }).select('rotationNumber').lean();
    return Number(latest?.rotationNumber || 0) + 1;
  };

  const createTokenValue = () => `attqr_${crypto.randomBytes(24).toString('base64url')}`;

  const revokeDocs = async (docs, referenceTime = nowProvider()) => {
    if (!docs.length) return;

    const revokedAt = referenceTime;
    await Promise.all(
      docs.map(async (doc) => {
        doc.isRevoked = true;
        doc.revokedAt = revokedAt;
        await doc.save();
      })
    );
  };

  const createTokenDoc = async ({ createdBy, sessionType, referenceTime = nowProvider() }) => {
    const normalizedSessionType = normalizeSessionType(sessionType);
    const { expiresAt, ttlSeconds } = await getDailyExpiry(normalizedSessionType, referenceTime);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const rotationNumber = await getNextRotationNumber();
      try {
        const created = await AttendanceQrTokenModel.create({
          token: createTokenValue(),
          sessionType: normalizedSessionType,
          rotationNumber,
          expiresAt,
          createdBy: createdBy || null,
          isRevoked: false,
          revokedAt: null
        });
        return { created, ttlSeconds };
      } catch (error) {
        if (error && error.code === 11000) {
          continue;
        }
        throw error;
      }
    }

    throw createValidationError('Unable to create a unique attendance QR token. Please try again.', 500);
  };

  const getCurrentToken = async (sessionType) => {
    const now = nowProvider();
    const [current, recent, defaultExpiresInSeconds] = await Promise.all([
      getCurrentActiveDoc(now, sessionType),
      AttendanceQrTokenModel.find({}).sort({ createdAt: -1, rotationNumber: -1 }).limit(5).lean(),
      getPolicy()
    ]);

    return {
      current: formatToken(current, now),
      recent: recent.map((item) => formatToken(item, now)),
      policy: {
        defaultExpiresInSeconds: 21600
      }
    };
  };

  const generateToken = async ({ createdBy, sessionType } = {}) => {
    const now = nowProvider();
    const existing = await getCurrentActiveDoc(now, sessionType);
    if (existing) {
      throw createValidationError('An active attendance QR token already exists. Rotate or revoke it first.', 409);
    }

    const { created, ttlSeconds } = await createTokenDoc({ createdBy, sessionType, referenceTime: now });
    return {
      current: formatToken(created, now),
      policy: {
        defaultExpiresInSeconds: ttlSeconds
      }
    };
  };

  const rotateToken = async ({ createdBy, sessionType } = {}) => {
    const now = nowProvider();
    const activeDocs = await AttendanceQrTokenModel.find(getActiveFilter(now, sessionType)).sort({ createdAt: -1, rotationNumber: -1 });
    await revokeDocs(activeDocs, now);

    const { created, ttlSeconds } = await createTokenDoc({ createdBy, sessionType, referenceTime: now });
    return {
      previous: activeDocs.map((item) => formatToken(item, now)),
      current: formatToken(created, now),
      policy: {
        defaultExpiresInSeconds: ttlSeconds
      }
    };
  };

  const revokeCurrentToken = async (sessionType) => {
    const now = nowProvider();
    const current = await getCurrentActiveDoc(now, sessionType);
    if (!current) {
      throw createValidationError('No active attendance QR token found.', 404);
    }

    current.isRevoked = true;
    current.revokedAt = now;
    await current.save();

    return {
      revoked: formatToken(current, now)
    };
  };

  return {
    buildQrPayload,
    getCurrentToken,
    generateToken,
    rotateToken,
    revokeCurrentToken
  };
};

module.exports = createAttendanceQrAdminService();
module.exports.createAttendanceQrAdminService = createAttendanceQrAdminService;