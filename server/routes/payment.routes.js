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
  query('status').optional().isIn(['paid', 'pending', 'overdue']),
  query('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  query('academicYear').optional().trim().isString(),
  query('semester').optional().isInt({ min: 1, max: 2 }),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  paymentController.listPayments
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  paymentController.getPayment
);

router.post(
  '/',
  adminOnly,
  body('receiptNumber').notEmpty().trim().isString(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('amount').isFloat({ min: 0 }),
  body('paymentDate').isISO8601(),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  body('status').isIn(['paid', 'pending', 'overdue']),
  body('remarks').optional().trim().isString(),
  validate,
  paymentController.createPayment
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('receiptNumber').notEmpty().trim().isString(),
  body('studentId').notEmpty().trim().isString(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('amount').isFloat({ min: 0 }),
  body('paymentDate').isISO8601(),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'mobile_money']),
  body('academicYear').optional().trim().isString(),
  body('semester').optional().isInt({ min: 1, max: 2 }),
  body('status').isIn(['paid', 'pending', 'overdue']),
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
