const express = require('express');
const { query } = require('express-validator');
const trafficController = require('../controllers/traffic-analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

/**
 * GET /api/traffic-analytics/metrics
 * Get traffic metrics overview
 */
router.get(
  '/metrics',
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getTrafficMetrics
);

/**
 * GET /api/traffic-analytics/search
 * Get search analytics
 */
router.get(
  '/search',
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getSearchAnalytics
);

/**
 * GET /api/traffic-analytics/top-content
 * Get top content (products, categories, sellers)
 */
router.get(
  '/top-content',
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getTopContent
);

/**
 * GET /api/traffic-analytics/trends
 * Get traffic trends
 */
router.get(
  '/trends',
  query('period').optional().isIn(['daily', 'weekly', 'monthly']),
  query('limit').optional().isInt({ min: 1, max: 365 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getTrafficTrends
);

/**
 * GET /api/traffic-analytics/search-growth
 * Get search growth trends
 */
router.get(
  '/search-growth',
  query('period').optional().isIn(['daily', 'weekly', 'monthly']),
  query('limit').optional().isInt({ min: 1, max: 365 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getSearchGrowth
);

/**
 * GET /api/traffic-analytics/visitor-growth
 * Get visitor growth trends
 */
router.get(
  '/visitor-growth',
  query('period').optional().isIn(['daily', 'weekly', 'monthly']),
  query('limit').optional().isInt({ min: 1, max: 365 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getVisitorGrowth
);

/**
 * GET /api/traffic-analytics/insights
 * Get traffic insights
 */
router.get(
  '/insights',
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate,
  trafficController.getTrafficInsights
);

module.exports = router;
