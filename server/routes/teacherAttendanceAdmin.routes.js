const express = require('express');
const { param, query } = require('express-validator');
const { body } = require('express-validator');
const controller = require('../controllers/teacherAttendanceAdmin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.post(
  '/settle-absent',
  adminOnly,
  body('date').optional().isISO8601(),
  body('sessionType').isIn(['morning', 'afternoon', 'evening']),
  validate,
  controller.settleAbsent
);

router.get(
  '/today',
  adminOnly,
  query('date').optional().isISO8601(),
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']),
  query('sessionType').optional().isIn(['morning', 'afternoon', 'evening']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  controller.getTodayAttendance
);

router.get(
  '/teacher/:teacherId',
  adminOnly,
  param('teacherId').isMongoId(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('status').optional().isIn(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']),
  query('sessionType').optional().isIn(['morning', 'afternoon', 'evening']),
  query('attendanceMethod').optional().isIn(['QR', 'FACE', 'MANUAL']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  controller.getTeacherAttendanceDetail
);

router.get(
  '/reports/daily',
  adminOnly,
  query('date').optional().isISO8601(),
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  controller.getDailyReport
);

router.get(
  '/reports/monthly',
  adminOnly,
  query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('search').optional().trim().isString(),
  validate,
  controller.getMonthlyReport
);

router.get(
  '/exports/excel',
  adminOnly,
  query('reportType').optional().isIn(['daily', 'monthly']),
  query('date').optional().isISO8601(),
  query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('search').optional().trim().isString(),
  validate,
  controller.exportExcel
);

router.get(
  '/exports/pdf',
  adminOnly,
  query('reportType').optional().isIn(['daily', 'monthly']),
  query('date').optional().isISO8601(),
  query('year').optional().isInt({ min: 2000, max: 2100 }).toInt(),
  query('month').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('search').optional().trim().isString(),
  validate,
  controller.exportPdf
);

module.exports = router;
