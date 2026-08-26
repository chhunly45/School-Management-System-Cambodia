const { AttendanceQrToken } = require('../../models');
const { createAttendanceError } = require('./errors');

const createQrTokenValidationService = ({
  AttendanceQrTokenModel = AttendanceQrToken,
  nowProvider = () => new Date()
} = {}) => {
  const validateToken = async (tokenText) => {
    let token = String(tokenText || '').trim();
    let payloadSessionType = null;

    if (token.startsWith('{') && token.endsWith('}')) {
      try {
        const parsed = JSON.parse(token);
        token = String(parsed.token || parsed.qrToken || '').trim();
        payloadSessionType = String(parsed.sessionType || '').trim().toLowerCase() || null;
      } catch {
        token = '';
      }
    }
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

    return {
      doc,
      sessionType: doc.sessionType || payloadSessionType || null
    };
  };

  return {
    validateToken
  };
};

module.exports = {
  createQrTokenValidationService
};
