const express = require('express');
const { body, param, query } = require('express-validator');
const routeController = require('../controllers/route.controller');
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
  routeController.listRoutes
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  routeController.getRoute
);

router.post(
  '/',
  adminOnly,
  body('routeCode').notEmpty().trim().isString(),
  body('routeName').notEmpty().trim().isString(),
  body('pickupAreas').isArray({ min: 1 }),
  body('pickupAreas.*').notEmpty().trim().isString(),
  body('estimatedDistanceKm').isFloat({ min: 0 }),
  body('estimatedDurationMinutes').isInt({ min: 0 }),
  body('status').isIn(['active', 'inactive']),
  body('notes').optional().trim().isString(),
  validate,
  routeController.createRoute
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('routeCode').notEmpty().trim().isString(),
  body('routeName').notEmpty().trim().isString(),
  body('pickupAreas').isArray({ min: 1 }),
  body('pickupAreas.*').notEmpty().trim().isString(),
  body('estimatedDistanceKm').isFloat({ min: 0 }),
  body('estimatedDurationMinutes').isInt({ min: 0 }),
  body('status').isIn(['active', 'inactive']),
  body('notes').optional().trim().isString(),
  validate,
  routeController.updateRoute
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  routeController.deleteRoute
);

module.exports = router;