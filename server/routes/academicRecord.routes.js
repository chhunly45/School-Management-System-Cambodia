const express = require('express');
const { body, param, query } = require('express-validator');
const academicRecordController = require('../controllers/academicRecord.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('className').optional().trim().isString(),
  query('subject').optional().trim().isString(),
  query('examType').optional().isIn(['midterm', 'final', 'quiz']),
  query('academicYear').optional().trim().isString(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  academicRecordController.listAcademicRecords
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  academicRecordController.getAcademicRecord
);

router.post(
  '/',
  adminOnly,
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('subject').notEmpty().trim().isString(),
  body('score').notEmpty().isFloat({ min: 0, max: 100 }),
  body('academicYear').notEmpty().trim().isString(),
  body('semester').notEmpty().isInt({ min: 1, max: 2 }),
  body('examType').notEmpty().isIn(['midterm', 'final', 'quiz']),
  body('remarks').optional().trim().isString(),
  validate,
  academicRecordController.createAcademicRecord
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('subject').notEmpty().trim().isString(),
  body('score').notEmpty().isFloat({ min: 0, max: 100 }),
  body('academicYear').notEmpty().trim().isString(),
  body('semester').notEmpty().isInt({ min: 1, max: 2 }),
  body('examType').notEmpty().isIn(['midterm', 'final', 'quiz']),
  body('remarks').optional().trim().isString(),
  validate,
  academicRecordController.updateAcademicRecord
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  academicRecordController.deleteAcademicRecord
);

module.exports = router;
