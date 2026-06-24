const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  body('seller').notEmpty().isMongoId().withMessage('Seller is required'),
  body('product').optional().isMongoId().withMessage('Invalid product identifier'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isString(),
  validate,
  reviewController.createReview
);

router.get(
  '/seller/:sellerId',
  param('sellerId').isMongoId().withMessage('Invalid seller identifier'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('perPage').optional().isInt({ min: 1 }).withMessage('perPage must be a positive integer'),
  validate,
  reviewController.getSellerReviews
);

module.exports = router;
