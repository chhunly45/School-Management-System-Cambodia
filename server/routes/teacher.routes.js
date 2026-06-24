const express = require('express');
const { body, param, query } = require('express-validator');
const teacherController = require('../controllers/teacher.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['active', 'inactive']),
  query('className').optional().trim().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  teacherController.listTeachers
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  teacherController.getTeacher
);

router.post(
  '/',
  adminOnly,
  body('teacherId').notEmpty().trim().isString(),
  body('fullName').notEmpty().trim().isString(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional().isISO8601(),
  body('phone').optional().trim().isString(),
  body('email').optional().trim().isEmail(),
  body('address').optional().trim().isString(),
  body('qualification').optional().isIn(['Bachelor', 'Master', 'PhD', 'Other']),
  body('specialization').optional().trim().isString(),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('className').optional().trim().isString(),
  body('subjects').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive']),
  body('joinDate').optional().isISO8601(),
  body('remarks').optional().trim().isString(),
  validate,
  teacherController.createTeacher
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('teacherId').notEmpty().trim().isString(),
  body('fullName').notEmpty().trim().isString(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('dateOfBirth').optional().isISO8601(),
  body('phone').optional().trim().isString(),
  body('email').optional().trim().isEmail(),
  body('address').optional().trim().isString(),
  body('qualification').optional().isIn(['Bachelor', 'Master', 'PhD', 'Other']),
  body('specialization').optional().trim().isString(),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('className').optional().trim().isString(),
  body('subjects').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive']),
  body('joinDate').optional().isISO8601(),
  body('remarks').optional().trim().isString(),
  validate,
  teacherController.updateTeacher
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  teacherController.deleteTeacher
);

module.exports = router;
