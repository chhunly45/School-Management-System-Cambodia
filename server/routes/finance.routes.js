const express = require('express');
const { query } = require('express-validator');
const financeController = require('../controllers/finance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get('/summary', adminOnly, financeController.getSummary);

router.get(
  '/payments-report',
  adminOnly,
  query('academicYear').optional().trim().isString(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('className').optional().trim().isString(),
  query('status').optional().isIn(['paid', 'pending', 'overdue']),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  financeController.getPaymentsReport
);

router.get(
  '/payment-tracking',
  adminOnly,
  query('search').optional().trim().isString(),
  query('session').optional().trim().isString(),
  query('room').optional().trim().isString(),
  query('status').optional().trim().isString(),
  query('plan').optional().trim().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  financeController.getPaymentTracking
);

module.exports = router;
