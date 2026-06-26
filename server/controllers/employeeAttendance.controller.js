const employeeAttendanceService = require('../services/employeeAttendance.service');

const listEmployeeAttendance = async (req, res, next) => {
  try {
    const attendances = await employeeAttendanceService.listEmployeeAttendance(req.query);
    res.json({ success: true, data: attendances });
  } catch (error) {
    next(error);
  }
};

const getEmployeeAttendance = async (req, res, next) => {
  try {
    const attendance = await employeeAttendanceService.getEmployeeAttendanceById(req.params.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const createEmployeeAttendance = async (req, res, next) => {
  try {
    const payload = { ...req.body, recordedBy: req.user?._id };
    const attendance = await employeeAttendanceService.createEmployeeAttendance(payload);
    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const updateEmployeeAttendance = async (req, res, next) => {
  try {
    const attendance = await employeeAttendanceService.updateEmployeeAttendance(req.params.id, req.body);
    res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
};

const deleteEmployeeAttendance = async (req, res, next) => {
  try {
    await employeeAttendanceService.deleteEmployeeAttendance(req.params.id);
    res.json({ success: true, message: 'Employee attendance record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEmployeeAttendance,
  getEmployeeAttendance,
  createEmployeeAttendance,
  updateEmployeeAttendance,
  deleteEmployeeAttendance
};