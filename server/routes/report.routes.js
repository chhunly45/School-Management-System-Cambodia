const express = require('express');
const { body, param } = require('express-validator');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

const reasonOptions = ['scam', 'fake_product', 'duplicate_listing', 'wrong_category', 'other'];

router.post(
  '/',
  authMiddleware,
  body('targetType').isIn(['product', 'user']).withMessage('Invalid target type'),
  body('targetId').isMongoId().withMessage('Valid targetId is required'),
  body('reason').isIn(reasonOptions).withMessage('Valid reason is required'),
  body('details').optional().trim().isString(),
  validate,
  reportController.createReport
);

router.get('/me', authMiddleware, reportController.getMyReports);

module.exports = router;
