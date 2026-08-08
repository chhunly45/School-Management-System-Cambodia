const express = require('express');
const { body, query } = require('express-validator');
const teacherAttendanceController = require('../controllers/teacherAttendance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.post(
  '/check-in',
  authMiddleware,
  body('attendanceMethod').optional().isIn(['QR', 'FACE', 'MANUAL']),
  body('qrToken').optional().trim().isString(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('gpsAccuracy').optional().isFloat({ min: 0 }),
  body('remarks').optional().trim().isString(),
  body('device').optional().trim().isString(),
  validate,
  teacherAttendanceController.checkIn
);

router.post(
  '/check-out',
  authMiddleware,
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('gpsAccuracy').optional().isFloat({ min: 0 }),
  body('remarks').optional().trim().isString(),
  body('device').optional().trim().isString(),
  validate,
  teacherAttendanceController.checkOut
);

router.get('/today', authMiddleware, validate, teacherAttendanceController.getTodayAttendance);

router.get(
  '/history',
  authMiddleware,
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('status').optional().isIn(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']),
  query('attendanceMethod').optional().isIn(['QR', 'FACE', 'MANUAL']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('perPage').optional().isInt({ min: 1, max: 100 }).toInt(),
  validate,
  teacherAttendanceController.getAttendanceHistory
);

module.exports = router;
