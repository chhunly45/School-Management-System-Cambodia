const express = require('express');
const { body, param, query } = require('express-validator');
const classController = require('../controllers/class.controller');
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
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  classController.listClasses
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  classController.getClass
);

router.post(
  '/',
  adminOnly,
  body('className').notEmpty().trim().isString(),
  body('academicYearId').notEmpty().isMongoId(),
  body('gradeId').notEmpty().isMongoId(),
  body('capacity').notEmpty().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('description').optional().trim().isString(),
  validate,
  classController.createClass
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('className').notEmpty().trim().isString(),
  body('academicYearId').notEmpty().isMongoId(),
  body('gradeId').notEmpty().isMongoId(),
  body('capacity').notEmpty().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive', 'archived']),
  body('description').optional().trim().isString(),
  validate,
  classController.updateClass
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  classController.deleteClass
);

module.exports = router;
