const defaultTeacherAttendanceService = require('../services/teacherAttendance.service');

const createTeacherAttendanceController = ({
  teacherAttendanceService = defaultTeacherAttendanceService
} = {}) => {
  const checkIn = async (req, res, next) => {
    try {
      const attendance = await teacherAttendanceService.checkIn({
        user: req.user,
        attendanceMethod: req.body.attendanceMethod,
        qrToken: req.body.qrToken,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        gpsAccuracy: req.body.gpsAccuracy,
        remarks: req.body.remarks,
        device: req.body.device,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id'],
        sessionType: req.body.sessionType
      });

      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  };

  const checkOut = async (req, res, next) => {
    try {
      const attendance = await teacherAttendanceService.checkOut({
        user: req.user,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        gpsAccuracy: req.body.gpsAccuracy,
        remarks: req.body.remarks,
        device: req.body.device,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.headers['x-request-id'],
        sessionType: req.body.sessionType
      });

      res.json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  };

  const getTodayAttendance = async (req, res, next) => {
    try {
      const data = await teacherAttendanceService.getTodayAttendance({
        user: req.user,
        sessionType: req.query?.sessionType
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const getAttendanceHistory = async (req, res, next) => {
    try {
      const data = await teacherAttendanceService.getAttendanceHistory({
        user: req.user,
        query: req.query
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  return {
    checkIn,
    checkOut,
    getTodayAttendance,
    getAttendanceHistory
  };
};

module.exports = createTeacherAttendanceController();
module.exports.createTeacherAttendanceController = createTeacherAttendanceController;
