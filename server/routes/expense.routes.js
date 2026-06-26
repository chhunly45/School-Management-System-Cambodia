const express = require('express');
const { body, param, query } = require('express-validator');
const expenseController = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

const CATEGORIES = ['salary', 'fuel', 'utilities', 'maintenance', 'office_supplies', 'teaching_materials', 'other'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'mobile_payment', 'check', 'other'];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('category').optional().isIn(CATEGORIES),
  query('paymentMethod').optional().isIn(PAYMENT_METHODS),
  query('currency').optional().trim().isString(),
  query('expenseDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  expenseController.listExpenses
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  expenseController.getExpense
);

router.post(
  '/',
  adminOnly,
  body('expenseDate').notEmpty().isISO8601(),
  body('category').notEmpty().isIn(CATEGORIES),
  body('description').notEmpty().trim().isString(),
  body('amount').notEmpty().isFloat({ gt: 0 }),
  body('currency').notEmpty().trim().isString(),
  body('paymentMethod').notEmpty().isIn(PAYMENT_METHODS),
  body('receiptNumber').optional().trim().isString(),
  body('notes').optional().trim().isString(),
  validate,
  expenseController.createExpense
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('expenseDate').notEmpty().isISO8601(),
  body('category').notEmpty().isIn(CATEGORIES),
  body('description').notEmpty().trim().isString(),
  body('amount').notEmpty().isFloat({ gt: 0 }),
  body('currency').notEmpty().trim().isString(),
  body('paymentMethod').notEmpty().isIn(PAYMENT_METHODS),
  body('receiptNumber').optional().trim().isString(),
  body('notes').optional().trim().isString(),
  validate,
  expenseController.updateExpense
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  expenseController.deleteExpense
);

module.exports = router;