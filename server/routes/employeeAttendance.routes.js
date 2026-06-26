const express = require('express');
const { body, param, query } = require('express-validator');
const employeeAttendanceController = require('../controllers/employeeAttendance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('date').optional().isISO8601(),
  query('employeeType').optional().trim().isString(),
  query('status').optional().isIn(['present', 'late', 'leave', 'absent']),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  employeeAttendanceController.listEmployeeAttendance
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  employeeAttendanceController.getEmployeeAttendance
);

router.post(
  '/',
  adminOnly,
  body('employeeCode').notEmpty().trim().isString(),
  body('employeeName').notEmpty().trim().isString(),
  body('employeeType').optional().trim().isString(),
  body('department').optional().trim().isString(),
  body('scheduleLabel').optional().trim().isString(),
  body('workStartTime').optional().trim().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('workEndTime').optional().trim().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('date').notEmpty().isISO8601(),
  body('status').isIn(['present', 'late', 'leave', 'absent']),
  body('remarks').optional().trim().isString(),
  validate,
  employeeAttendanceController.createEmployeeAttendance
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('employeeCode').notEmpty().trim().isString(),
  body('employeeName').notEmpty().trim().isString(),
  body('employeeType').optional().trim().isString(),
  body('department').optional().trim().isString(),
  body('scheduleLabel').optional().trim().isString(),
  body('workStartTime').optional().trim().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('workEndTime').optional().trim().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('date').notEmpty().isISO8601(),
  body('status').isIn(['present', 'late', 'leave', 'absent']),
  body('remarks').optional().trim().isString(),
  validate,
  employeeAttendanceController.updateEmployeeAttendance
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  employeeAttendanceController.deleteEmployeeAttendance
);

module.exports = router;