const crypto = require('crypto');
const { AttendanceQrToken, SchoolSetting } = require('../models');
const { getDefaultPolicy, SCHOOL_SETTINGS_KEY } = require('./teacherAttendance/attendancePolicy.service');

const MIN_EXPIRY_SECONDS = 30;
const MAX_EXPIRY_SECONDS = 60 * 60 * 24;

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
  const buildQrPayload = (token) => JSON.stringify({ token });

  const getDefaultExpirySeconds = async () => {
    const settings = await SchoolSettingModel.findOne({ singletonKey: settingsKey })
      .select('attendanceQrRotationSeconds')
      .lean();

    return Number(settings?.attendanceQrRotationSeconds || getDefaultPolicy().attendanceQrRotationSeconds);
  };

  const resolveExpirySeconds = async (expiresInSeconds) => {
    if (expiresInSeconds === undefined || expiresInSeconds === null || expiresInSeconds === '') {
      return getDefaultExpirySeconds();
    }

    const value = Number(expiresInSeconds);
    if (!Number.isInteger(value) || value < MIN_EXPIRY_SECONDS || value > MAX_EXPIRY_SECONDS) {
      throw createValidationError(
        `expiresInSeconds must be an integer between ${MIN_EXPIRY_SECONDS} and ${MAX_EXPIRY_SECONDS}`,
        422
      );
    }

    return value;
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
      qrPayloadFormat: 'json-token-v1',
      qrPayload: buildQrPayload(doc.token)
    };
  };

  const getActiveFilter = (referenceTime = nowProvider()) => ({
    isRevoked: false,
    expiresAt: { $gt: referenceTime }
  });

  const getCurrentActiveDoc = async (referenceTime = nowProvider()) => {
    return AttendanceQrTokenModel.findOne(getActiveFilter(referenceTime))
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

  const createTokenDoc = async ({ createdBy, expiresInSeconds, referenceTime = nowProvider() }) => {
    const ttlSeconds = await resolveExpirySeconds(expiresInSeconds);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const rotationNumber = await getNextRotationNumber();
      try {
        const created = await AttendanceQrTokenModel.create({
          token: createTokenValue(),
          rotationNumber,
          expiresAt: new Date(referenceTime.getTime() + ttlSeconds * 1000),
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

  const getCurrentToken = async () => {
    const now = nowProvider();
    const [current, recent, defaultExpiresInSeconds] = await Promise.all([
      getCurrentActiveDoc(now),
      AttendanceQrTokenModel.find({}).sort({ createdAt: -1, rotationNumber: -1 }).limit(5).lean(),
      getDefaultExpirySeconds()
    ]);

    return {
      current: formatToken(current, now),
      recent: recent.map((item) => formatToken(item, now)),
      policy: {
        defaultExpiresInSeconds
      }
    };
  };

  const generateToken = async ({ createdBy, expiresInSeconds } = {}) => {
    const now = nowProvider();
    const existing = await getCurrentActiveDoc(now);
    if (existing) {
      throw createValidationError('An active attendance QR token already exists. Rotate or revoke it first.', 409);
    }

    const { created, ttlSeconds } = await createTokenDoc({ createdBy, expiresInSeconds, referenceTime: now });
    return {
      current: formatToken(created, now),
      policy: {
        defaultExpiresInSeconds: ttlSeconds
      }
    };
  };

  const rotateToken = async ({ createdBy, expiresInSeconds } = {}) => {
    const now = nowProvider();
    const activeDocs = await AttendanceQrTokenModel.find(getActiveFilter(now)).sort({ createdAt: -1, rotationNumber: -1 });
    await revokeDocs(activeDocs, now);

    const { created, ttlSeconds } = await createTokenDoc({ createdBy, expiresInSeconds, referenceTime: now });
    return {
      previous: activeDocs.map((item) => formatToken(item, now)),
      current: formatToken(created, now),
      policy: {
        defaultExpiresInSeconds: ttlSeconds
      }
    };
  };

  const revokeCurrentToken = async () => {
    const now = nowProvider();
    const current = await getCurrentActiveDoc(now);
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
module.exports.MIN_EXPIRY_SECONDS = MIN_EXPIRY_SECONDS;
module.exports.MAX_EXPIRY_SECONDS = MAX_EXPIRY_SECONDS;