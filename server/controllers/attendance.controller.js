const attendanceService = require('../services/attendance.service');

const listAttendance = async (req, res, next) => {
  try {
    const attendances = await attendanceService.listAttendance(req.query);
    res.json({ success: true, data: attendances });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (req, res, next) => {
  try {
    const report = await attendanceService.getMonthlyAttendanceReport(req.query);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const createAttendance = async (req, res, next) => {
  try {
    const payload = { ...req.body, recordedBy: req.user?._id };
    const attendance = await attendanceService.createAttendance(payload);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.updateAttendance(req.params.id, req.body);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    await attendanceService.deleteAttendance(req.params.id);
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAttendance,
  getMonthlyReport,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance
};
