const express = require('express');
const { body, param, query } = require('express-validator');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['paid', 'pending', 'overdue', 'due_soon', 'grace_period']),
  query('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  query('paymentType').optional().isIn(['monthly', 'quarterly', 'yearly']),
  query('paymentPlan').optional().isIn(['monthly', 'quarterly', 'yearly']),
  query('studentId').optional().trim().isString(),
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('classId').optional().isMongoId(),
  query('includeRelations').optional().isBoolean().toBoolean(),
  query('academicYear').optional().trim().isString(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  validate,
  paymentController.listPayments
);

router.get(
  '/summary/monthly',
  adminOnly,
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('academicYearId').optional().isMongoId(),
  query('gradeId').optional().isMongoId(),
  query('classId').optional().isMongoId(),
  validate,
  paymentController.getMonthlySummary
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  query('includeRelations').optional().isBoolean().toBoolean(),
  validate,
  paymentController.getPayment
);

router.post(
  '/',
  adminOnly,
  body('receiptNumber').optional().trim().isString(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('academicYearId').optional().isMongoId(),
  body('gradeId').optional().isMongoId(),
  body('classId').optional().isMongoId(),
  body('paymentType').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('paymentPlan').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('tuitionAmount').optional().isFloat({ min: 0 }),
  body('amount').isFloat({ min: 0 }),
  body('discount').optional().isFloat({ min: 0 }),
  body('remainingBalance').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('monthlyDueDay').optional().isInt({ min: 1, max: 31 }),
  body('quarterlyDueDates').optional().isArray(),
  body('yearlyDueDate').optional().trim().isString(),
  body('gracePeriodDays').optional().isInt({ min: 0, max: 365 }),
  body('cashier').optional().trim().isString(),
  body('paymentDate').isISO8601(),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  body('status').isIn(['paid', 'pending', 'overdue', 'due_soon', 'grace_period']),
  body('remarks').optional().trim().isString(),
  validate,
  paymentController.createPayment
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('receiptNumber').optional().trim().isString(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('academicYearId').optional().isMongoId(),
  body('gradeId').optional().isMongoId(),
  body('classId').optional().isMongoId(),
  body('paymentType').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('paymentPlan').optional().isIn(['monthly', 'quarterly', 'yearly']),
  body('tuitionAmount').optional().isFloat({ min: 0 }),
  body('amount').isFloat({ min: 0 }),
  body('discount').optional().isFloat({ min: 0 }),
  body('remainingBalance').optional().isFloat({ min: 0 }),
  body('dueDate').optional().isISO8601(),
  body('monthlyDueDay').optional().isInt({ min: 1, max: 31 }),
  body('quarterlyDueDates').optional().isArray(),
  body('yearlyDueDate').optional().trim().isString(),
  body('gracePeriodDays').optional().isInt({ min: 0, max: 365 }),
  body('cashier').optional().trim().isString(),
  body('paymentDate').isISO8601(),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  body('status').isIn(['paid', 'pending', 'overdue', 'due_soon', 'grace_period']),
  body('remarks').optional().trim().isString(),
  validate,
  paymentController.updatePayment
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  paymentController.deletePayment
);

module.exports = router;
