const express = require('express');
const { body, param, query } = require('express-validator');
const attendanceController = require('../controllers/attendance.controller');
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
  query('className').optional().trim().isString(),
  query('academicYear').optional().trim().isString(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  attendanceController.listAttendance
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  attendanceController.getAttendance
);

router.post(
  '/',
  adminOnly,
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('date').notEmpty().isISO8601(),
  body('status').isIn(['present', 'absent', 'late', 'excused']),
  body('remarks').optional().trim().isString(),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  validate,
  attendanceController.createAttendance
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('date').notEmpty().isISO8601(),
  body('status').isIn(['present', 'absent', 'late', 'excused']),
  body('remarks').optional().trim().isString(),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  validate,
  attendanceController.updateAttendance
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  attendanceController.deleteAttendance
);

module.exports = router;
