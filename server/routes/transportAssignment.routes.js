const express = require('express');
const { body, param, query } = require('express-validator');
const transportAssignmentController = require('../controllers/transportAssignment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['scheduled', 'running', 'completed', 'cancelled']),
  query('assignmentDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  transportAssignmentController.listTransportAssignments
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  transportAssignmentController.getTransportAssignment
);

router.post(
  '/',
  adminOnly,
  body('assignmentDate').notEmpty().isISO8601(),
  body('vehicleId').notEmpty().isMongoId(),
  body('routeId').notEmpty().isMongoId(),
  body('driverEmployeeCode').notEmpty().trim().isString(),
  body('driverName').optional().trim().isString(),
  body('status').isIn(['scheduled', 'running', 'completed', 'cancelled']),
  body('notes').optional().trim().isString(),
  validate,
  transportAssignmentController.createTransportAssignment
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('assignmentDate').notEmpty().isISO8601(),
  body('vehicleId').notEmpty().isMongoId(),
  body('routeId').notEmpty().isMongoId(),
  body('driverEmployeeCode').notEmpty().trim().isString(),
  body('driverName').optional().trim().isString(),
  body('status').isIn(['scheduled', 'running', 'completed', 'cancelled']),
  body('notes').optional().trim().isString(),
  validate,
  transportAssignmentController.updateTransportAssignment
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  transportAssignmentController.deleteTransportAssignment
);

module.exports = router;