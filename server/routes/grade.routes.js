const express = require('express');
const { body, param, query } = require('express-validator');
const gradeController = require('../controllers/grade.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['active', 'inactive', 'archived']),
  query('level').optional().isInt({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  gradeController.listGrades
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  gradeController.getGrade
);

router.post(
  '/',
  adminOnly,
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('level').notEmpty().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('remarks').optional().trim().isString(),
  validate,
  gradeController.createGrade
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('level').notEmpty().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('remarks').optional().trim().isString(),
  validate,
  gradeController.updateGrade
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  gradeController.deleteGrade
);

module.exports = router;
