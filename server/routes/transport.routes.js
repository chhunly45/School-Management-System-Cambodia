const express = require('express');
const { body, param, query } = require('express-validator');
const transportController = require('../controllers/transport.controller');
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
  query('routeName').optional().trim().isString(),
  query('academicYear').optional().trim().isString(),
  query('studentId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  transportController.listTransport
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  transportController.getTransport
);

router.post(
  '/',
  adminOnly,
  body('studentId').notEmpty().isMongoId(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('routeName').notEmpty().trim().isString(),
  body('pickupPoint').notEmpty().trim().isString(),
  body('dropoffPoint').optional().trim().isString(),
  body('driverName').optional().trim().isString(),
  body('vehicleNumber').optional().trim().isString(),
  body('monthlyFee').optional().isFloat({ min: 0 }),
  body('status').isIn(['active', 'inactive']),
  body('academicYear').optional().trim().isString(),
  body('remarks').optional().trim().isString(),
  validate,
  transportController.createTransport
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('studentId').notEmpty().isMongoId(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('routeName').notEmpty().trim().isString(),
  body('pickupPoint').notEmpty().trim().isString(),
  body('dropoffPoint').optional().trim().isString(),
  body('driverName').optional().trim().isString(),
  body('vehicleNumber').optional().trim().isString(),
  body('monthlyFee').optional().isFloat({ min: 0 }),
  body('status').isIn(['active', 'inactive']),
  body('academicYear').optional().trim().isString(),
  body('remarks').optional().trim().isString(),
  validate,
  transportController.updateTransport
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  transportController.deleteTransport
);

module.exports = router;
