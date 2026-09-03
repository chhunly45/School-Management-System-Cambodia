const defaultService = require('../services/attendanceQrAdmin.service');

const createAttendanceQrAdminController = ({ service = defaultService } = {}) => {
  const getCurrent = async (req, res, next) => {
    try {
      const data = await service.getCurrentToken(req.query.sessionType);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const generate = async (req, res, next) => {
    try {
      const data = await service.generateToken({
        createdBy: req.user?._id,
        expiresInSeconds: req.body.expiresInSeconds,
        sessionType: req.body.sessionType
      });
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const rotate = async (req, res, next) => {
    try {
      const data = await service.rotateToken({
        createdBy: req.user?._id,
        expiresInSeconds: req.body.expiresInSeconds,
        sessionType: req.body.sessionType
      });
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const revoke = async (req, res, next) => {
    try {
      const data = await service.revokeCurrentToken(req.body.sessionType);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  return {
    getCurrent,
    generate,
    rotate,
    revoke
  };
};

module.exports = createAttendanceQrAdminController();
module.exports.createAttendanceQrAdminController = createAttendanceQrAdminController;