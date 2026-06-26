const express = require('express');
const { body, param, query } = require('express-validator');
const subjectController = require('../controllers/subject.controller');
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
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  subjectController.listSubjects
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  subjectController.getSubject
);

router.post(
  '/',
  adminOnly,
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('description').optional().trim().isString(),
  body('credit').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive']),
  validate,
  subjectController.createSubject
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('code').notEmpty().trim().isString(),
  body('name').notEmpty().trim().isString(),
  body('description').optional().trim().isString(),
  body('credit').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['active', 'inactive']),
  validate,
  subjectController.updateSubject
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  subjectController.deleteSubject
);

module.exports = router;