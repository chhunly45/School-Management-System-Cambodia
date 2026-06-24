const adminService = require('../services/admin.service');
const promotionService = require('../services/promotion.service');
const revenueService = require('../services/revenue.service');
const reviewService = require('../services/review.service');
const emailService = require('../services/email.service');
const config = require('../config');

const getOverview = async (req, res, next) => {
  try {
    const overview = await adminService.getOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers(req.query);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus(req.params.id, req.body, req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = await adminService.listProducts(req.query);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const product = await adminService.updateProductStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProductFeatured = async (req, res, next) => {
  try {
    const featured = req.body.featured === true;
    const product = await adminService.updateProductFeatured(req.params.id, featured, req.user.id);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const listReports = async (req, res, next) => {
  try {
    const reports = await adminService.listReports(req.query);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const report = await adminService.updateReportStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const logs = await adminService.listAuditLogs(req.query);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

const backfillProductSellers = async (req, res, next) => {
  try {
    const result = await adminService.backfillProductSellers();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

const getProductsByProvince = async (req, res, next) => {
  try {
    const data = await adminService.getProductsByProvince();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const listPromotions = async (req, res, next) => {
  try {
    const promotions = await promotionService.listPromotions(req.query);
    res.json({ success: true, data: promotions });
  } catch (error) {
    next(error);
  }
};

const getPromotionMetrics = async (req, res, next) => {
  try {
    const metrics = await promotionService.getPromotionMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const approvePromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.approvePromotion(req.params.id, req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const rejectPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.rejectPromotion(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const extendPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.extendPromotion(req.params.id, Number(req.body.extraDays), req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const cancelPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.cancelPromotion(req.params.id, req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    // Only allow in development environment or explicitly enabled
    if (config.nodeEnv === 'production' && process.env.ENABLE_EMAIL_TEST !== 'true') {
      const error = new Error('Test email endpoint is disabled in production');
      error.statusCode = 403;
      throw error;
    }

    const { to } = req.body;
    if (!to) {
      const error = new Error('Email address required in request body: { to: "email@example.com" }');
      error.statusCode = 400;
      throw error;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      const error = new Error('Invalid email address format');
      error.statusCode = 400;
      throw error;
    }

    console.log(`[EMAIL] Test email initiated by admin ${req.user.id} for recipient: ${emailService.maskEmail(to)}`);

    await emailService.sendEmail({
      to,
      subject: 'Konpuk - Test Email',
      text: 'This is a test email from your Konpuk backend. If you received this, email delivery is working correctly.',
      html: '<p>This is a test email from your Konpuk backend.</p><p>If you received this, email delivery is working correctly.</p>'
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        recipient: emailService.maskEmail(to),
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueMetrics = async (req, res, next) => {
  try {
    const metrics = await revenueService.getRevenueMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getDailyRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    const data = await revenueService.getDailyRevenue({ startDate, endDate, limit: Number(limit) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getWeeklyRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 12 } = req.query;
    const data = await revenueService.getWeeklyRevenue({ startDate, endDate, limit: Number(limit) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getMonthlyRevenue = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 12 } = req.query;
    const data = await revenueService.getMonthlyRevenue({ startDate, endDate, limit: Number(limit) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getRevenueBySeller = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    const data = await revenueService.getRevenueBySeller({ startDate, endDate, limit: Number(limit) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  listUsers,
  updateUserStatus,
  listProducts,
  updateProductStatus,
  updateProductFeatured,
  listReports,
  updateReportStatus,
  listAuditLogs,
  deleteReview,
  backfillProductSellers,
  sendTestEmail,
  getProductsByProvince,
  listPromotions,
  getPromotionMetrics,
  approvePromotion,
  rejectPromotion,
  extendPromotion,
  cancelPromotion,
  getRevenueMetrics,
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getRevenueBySeller
};
