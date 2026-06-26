const express = require('express');
const { body, param, query } = require('express-validator');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['active', 'inactive', 'graduated']),
  query('className').optional().trim().isString(),
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('classId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  studentController.listStudents
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  studentController.getStudent
);

router.post(
  '/',
  adminOnly,
  body('studentId').notEmpty().trim().isString(),
  body('fullName').notEmpty().trim().isString(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional().isISO8601(),
  body('phone').optional().trim().isString(),
  body('address').optional().trim().isString(),
  body('guardianName').optional().trim().isString(),
  body('guardianPhone').optional().trim().isString(),
  body('className').optional().trim().isString(),
  body('academicYearId').optional().isMongoId(),
  body('gradeId').optional().isMongoId(),
  body('classId').optional().isMongoId(),
  body('status').optional().isIn(['active', 'inactive', 'graduated']),
  validate,
  studentController.createStudent
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('studentId').notEmpty().trim().isString(),
  body('fullName').notEmpty().trim().isString(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional().isISO8601(),
  body('phone').optional().trim().isString(),
  body('address').optional().trim().isString(),
  body('guardianName').optional().trim().isString(),
  body('guardianPhone').optional().trim().isString(),
  body('className').optional().trim().isString(),
  body('academicYearId').optional().isMongoId(),
  body('gradeId').optional().isMongoId(),
  body('classId').optional().isMongoId(),
  body('status').optional().isIn(['active', 'inactive', 'graduated']),
  validate,
  studentController.updateStudent
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  studentController.deleteStudent
);

module.exports = router;
