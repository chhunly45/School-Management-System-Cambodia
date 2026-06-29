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
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('classId').optional().isMongoId(),
  query('academicYear').optional().trim().isString(),
  query('status').optional().isIn(['present', 'absent', 'late', 'excused']),
  query('includeRelations').optional().isBoolean().toBoolean(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  attendanceController.listAttendance
);

router.get(
  '/reports/monthly',
  adminOnly,
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('classId').optional().isMongoId(),
  query('status').optional().isIn(['present', 'absent', 'late', 'excused']),
  validate,
  attendanceController.getMonthlyReport
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
  body('academicYearId').optional({ values: 'falsy' }).trim().isMongoId(),
  body('gradeId').optional({ values: 'falsy' }).trim().isMongoId(),
  body('classId').optional({ values: 'falsy' }).trim().isMongoId(),
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
  body('academicYearId').optional({ values: 'falsy' }).trim().isMongoId(),
  body('gradeId').optional({ values: 'falsy' }).trim().isMongoId(),
  body('classId').optional({ values: 'falsy' }).trim().isMongoId(),
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
