const reportService = require('../services/report.service');

const createReport = async (req, res, next) => {
  try {
    const report = await reportService.createReport({
      reporterId: req.user.id,
      targetType: req.body.targetType,
      targetId: req.body.targetId,
      reason: req.body.reason,
      details: req.body.details
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await reportService.listUserReports(req.user.id);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getMyReports
};
