const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const rateLimit = require('express-rate-limit');

const router = express.Router();
// Apply authentication and role checks first
router.use(authMiddleware, roleMiddleware(['admin', 'moderator']));

// Stricter limiter for admin actions
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // allow fewer requests for admin endpoints
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `admin:${req.user.id}` : req.ip),
  message: { success: false, message: 'Too many admin requests, please try later.' }
});

router.use(adminLimiter);

router.get('/overview', adminController.getOverview);
router.get('/analytics/products-by-province', adminController.getProductsByProvince);
router.get('/revenue/metrics', adminController.getRevenueMetrics);
router.get('/revenue/daily', adminController.getDailyRevenue);
router.get('/revenue/weekly', adminController.getWeeklyRevenue);
router.get('/revenue/monthly', adminController.getMonthlyRevenue);
router.get('/revenue/by-seller', adminController.getRevenueBySeller);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status',
  param('id').isMongoId(),
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['user','seller','admin','moderator']),
  body('sellerVerificationStatus').optional().isIn(['unverified','verified','rejected']),
  body('verified').optional().isBoolean(),
  body('verificationStatus').optional().isIn(['none','pending','approved','rejected']),
  validate,
  adminController.updateUserStatus
);
router.get('/products', adminController.listProducts);
router.patch('/products/:id/status', param('id').isMongoId(), body('status').isIn(['published','sold','archived','flagged']).withMessage('Invalid status'), validate, adminController.updateProductStatus);
router.patch('/products/:id/featured', param('id').isMongoId(), body('featured').isBoolean(), validate, adminController.updateProductFeatured);
router.get('/promotions', adminController.listPromotions);
router.get('/promotions/metrics', adminController.getPromotionMetrics);
router.patch('/promotions/:id/approve', param('id').isMongoId(), validate, adminController.approvePromotion);
router.patch('/promotions/:id/reject', param('id').isMongoId(), body('reason').optional().trim(), validate, adminController.rejectPromotion);
router.patch('/promotions/:id/extend', param('id').isMongoId(), body('extraDays').isInt({ min: 1 }).withMessage('extraDays must be at least 1'), validate, adminController.extendPromotion);
router.patch('/promotions/:id/cancel', param('id').isMongoId(), validate, adminController.cancelPromotion);
router.get('/reports', adminController.listReports);
router.patch('/reports/:id', param('id').isMongoId(), body('status').isIn(['pending','reviewed','resolved','rejected']).withMessage('Invalid report status'), validate, adminController.updateReportStatus);
router.patch('/verification/:id', param('id').isMongoId(), body('status').isIn(['approved','rejected']).withMessage('Invalid verification status'), validate, verificationController.reviewVerification);
router.get('/audit-logs', adminController.listAuditLogs);
router.delete('/reviews/:id', param('id').isMongoId(), validate, adminController.deleteReview);
router.post('/email/test', body('to').isEmail(), validate, adminController.sendTestEmail);
router.post('/backfill/product-sellers', adminController.backfillProductSellers);

module.exports = router;
