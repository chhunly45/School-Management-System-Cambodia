const defaultService = require('../services/teacherAttendanceAdmin.service');

const createTeacherAttendanceAdminController = ({ service = defaultService } = {}) => {
  const getTodayAttendance = async (req, res, next) => {
    try {
      const data = await service.getTodayAttendance(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const getTeacherAttendanceDetail = async (req, res, next) => {
    try {
      const data = await service.getTeacherAttendanceDetail(req.params.teacherId, req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const getDailyReport = async (req, res, next) => {
    try {
      const data = await service.getDailyReport(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const getMonthlyReport = async (req, res, next) => {
    try {
      const data = await service.getMonthlyReport(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  const exportExcel = async (req, res, next) => {
    try {
      const file = await service.exportExcel(req.query);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.content);
    } catch (error) {
      next(error);
    }
  };

  const exportPdf = async (req, res, next) => {
    try {
      const file = await service.exportPdf(req.query);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.content);
    } catch (error) {
      next(error);
    }
  };

  return {
    getTodayAttendance,
    getTeacherAttendanceDetail,
    getDailyReport,
    getMonthlyReport,
    exportExcel,
    exportPdf
  };
};

module.exports = createTeacherAttendanceAdminController();
module.exports.createTeacherAttendanceAdminController = createTeacherAttendanceAdminController;
