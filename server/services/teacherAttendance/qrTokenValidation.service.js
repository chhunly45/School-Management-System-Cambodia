const { AttendanceQrToken } = require('../../models');
const { createAttendanceError } = require('./errors');

const createQrTokenValidationService = ({
  AttendanceQrTokenModel = AttendanceQrToken,
  nowProvider = () => new Date()
} = {}) => {
  const validateToken = async (tokenText) => {
    const token = String(tokenText || '').trim();
    if (!token) {
      throw createAttendanceError('QR_INVALID', 'QR token is required', 422);
    }

    const doc = await AttendanceQrTokenModel.findOne({ token });
    if (!doc) {
      throw createAttendanceError('QR_INVALID', 'QR token is invalid', 422);
    }

    if (doc.isRevoked) {
      throw createAttendanceError('QR_REVOKED', 'QR token has been revoked', 422);
    }

    const now = nowProvider();
    if (new Date(doc.expiresAt).getTime() <= now.getTime()) {
      throw createAttendanceError('QR_EXPIRED', 'QR token has expired', 422);
    }

    return doc;
  };

  return {
    validateToken
  };
};

module.exports = {
  createQrTokenValidationService
};
