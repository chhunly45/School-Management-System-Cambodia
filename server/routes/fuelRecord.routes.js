const express = require('express');
const { body, param, query } = require('express-validator');
const fuelRecordController = require('../controllers/fuelRecord.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('vehicleId').optional().isMongoId(),
  query('fuelType').optional().isIn(['gasoline', 'diesel']),
  query('currency').optional().isString(),
  query('assignmentDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  fuelRecordController.listFuelRecords
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  fuelRecordController.getFuelRecord
);

router.post(
  '/',
  adminOnly,
  body('vehicleId').notEmpty().isMongoId(),
  body('transportAssignmentId').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body('assignmentDate').notEmpty().isISO8601(),
  body('odometer').notEmpty().isFloat({ min: 0 }),
  body('fuelType').notEmpty().isIn(['gasoline', 'diesel']),
  body('liters').notEmpty().isFloat({ gt: 0 }),
  body('pricePerLiter').notEmpty().isFloat({ min: 0 }),
  body('currency').notEmpty().trim().isString(),
  body('totalCost').optional().isFloat({ min: 0 }),
  body('fuelStation').notEmpty().trim().isString(),
  body('receiptNumber').optional().trim().isString(),
  body('notes').optional().trim().isString(),
  validate,
  fuelRecordController.createFuelRecord
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('vehicleId').notEmpty().isMongoId(),
  body('transportAssignmentId').optional({ nullable: true, checkFalsy: true }).isMongoId(),
  body('assignmentDate').notEmpty().isISO8601(),
  body('odometer').notEmpty().isFloat({ min: 0 }),
  body('fuelType').notEmpty().isIn(['gasoline', 'diesel']),
  body('liters').notEmpty().isFloat({ gt: 0 }),
  body('pricePerLiter').notEmpty().isFloat({ min: 0 }),
  body('currency').notEmpty().trim().isString(),
  body('totalCost').optional().isFloat({ min: 0 }),
  body('fuelStation').notEmpty().trim().isString(),
  body('receiptNumber').optional().trim().isString(),
  body('notes').optional().trim().isString(),
  validate,
  fuelRecordController.updateFuelRecord
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  fuelRecordController.deleteFuelRecord
);

module.exports = router;