const express = require('express');
const { body, param, query } = require('express-validator');
const academicYearController = require('../controllers/academicYear.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['planned', 'active', 'closed', 'archived']),
  query('isCurrent').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  academicYearController.listAcademicYears
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  academicYearController.getAcademicYear
);

router.post(
  '/',
  adminOnly,
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('startDate').notEmpty().isISO8601(),
  body('endDate').notEmpty().isISO8601(),
  body('status').optional().isIn(['planned', 'active', 'closed', 'archived']),
  body('isCurrent').optional().isBoolean(),
  body('remarks').optional().trim().isString(),
  validate,
  academicYearController.createAcademicYear
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('startDate').notEmpty().isISO8601(),
  body('endDate').notEmpty().isISO8601(),
  body('status').optional().isIn(['planned', 'active', 'closed', 'archived']),
  body('isCurrent').optional().isBoolean(),
  body('remarks').optional().trim().isString(),
  validate,
  academicYearController.updateAcademicYear
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  academicYearController.deleteAcademicYear
);

module.exports = router;
