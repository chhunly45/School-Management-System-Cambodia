const express = require('express');
const { param, query } = require('express-validator');
const analyticsController = require('../controllers/seller-analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/seller-analytics
 * Get current seller's analytics overview
 */
router.get('/', analyticsController.getSellerAnalytics);

/**
 * GET /api/seller-analytics/top-products
 * Get top products by views, favorites, or messages
 * Query params: sortBy (views|favorites|messages), limit (default 10)
 */
router.get(
  '/top-products',
  query('sortBy').optional().isIn(['views', 'favorites', 'messages']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  analyticsController.getTopProducts
);

/**
 * GET /api/seller-analytics/daily-views
 * Get daily view data
 */
router.get(
  '/daily-views',
  query('limit').optional().isInt({ min: 1, max: 365 }),
  validate,
  analyticsController.getDailyViewData
);

/**
 * GET /api/seller-analytics/weekly-views
 * Get weekly view data
 */
router.get(
  '/weekly-views',
  query('limit').optional().isInt({ min: 1, max: 52 }),
  validate,
  analyticsController.getWeeklyViewData
);

/**
 * GET /api/seller-analytics/monthly-views
 * Get monthly view data
 */
router.get(
  '/monthly-views',
  query('limit').optional().isInt({ min: 1, max: 60 }),
  validate,
  analyticsController.getMonthlyViewData
);

/**
 * GET /api/seller-analytics/growth
 * Get listing growth data
 */
router.get(
  '/growth',
  query('limit').optional().isInt({ min: 1, max: 365 }),
  validate,
  analyticsController.getListingGrowthData
);

/**
 * GET /api/seller-analytics/insights
 * Get seller insights and recommendations
 */
router.get('/insights', analyticsController.getSellerInsights);

module.exports = router;
