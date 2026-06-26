const express = require('express');
const { body, param, query } = require('express-validator');
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('fuelType').optional().isIn(['gasoline', 'diesel']),
  query('status').optional().isIn(['active', 'maintenance', 'out_of_service']),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  vehicleController.listVehicles
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  vehicleController.getVehicle
);

router.post(
  '/',
  adminOnly,
  body('vehicleCode').notEmpty().trim().isString(),
  body('plateNumber').notEmpty().trim().isString(),
  body('brand').notEmpty().trim().isString(),
  body('model').notEmpty().trim().isString(),
  body('year').isInt({ min: 1900, max: 2100 }),
  body('color').optional().trim().isString(),
  body('seatCapacity').isInt({ min: 1, max: 200 }),
  body('fuelType').isIn(['gasoline', 'diesel']),
  body('status').isIn(['active', 'maintenance', 'out_of_service']),
  body('notes').optional().trim().isString(),
  validate,
  vehicleController.createVehicle
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('vehicleCode').notEmpty().trim().isString(),
  body('plateNumber').notEmpty().trim().isString(),
  body('brand').notEmpty().trim().isString(),
  body('model').notEmpty().trim().isString(),
  body('year').isInt({ min: 1900, max: 2100 }),
  body('color').optional().trim().isString(),
  body('seatCapacity').isInt({ min: 1, max: 200 }),
  body('fuelType').isIn(['gasoline', 'diesel']),
  body('status').isIn(['active', 'maintenance', 'out_of_service']),
  body('notes').optional().trim().isString(),
  validate,
  vehicleController.updateVehicle
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  vehicleController.deleteVehicle
);

module.exports = router;