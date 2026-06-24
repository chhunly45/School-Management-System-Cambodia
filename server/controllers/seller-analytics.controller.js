const analyticsService = require('../services/seller-analytics.service');

const getSellerAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;

    // Permission check: user can view own analytics or admin can view any
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot view other seller analytics' });
    }

    const analytics = await analyticsService.getSellerAnalytics(sellerId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;
    const { sortBy = 'views', limit = 10 } = req.query;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const products = await analyticsService.getTopProducts(sellerId, sortBy, Number(limit));
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const getDailyViewData = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;
    const { limit = 30 } = req.query;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getDailyViewData(sellerId, Number(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getWeeklyViewData = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;
    const { limit = 12 } = req.query;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getWeeklyViewData(sellerId, Number(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getMonthlyViewData = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;
    const { limit = 12 } = req.query;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getMonthlyViewData(sellerId, Number(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getListingGrowthData = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;
    const { limit = 30 } = req.query;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await analyticsService.getListingGrowthData(sellerId, Number(limit));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getSellerInsights = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;

    // Permission check
    if (sellerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const insights = await analyticsService.getSellerInsights(sellerId);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerAnalytics,
  getTopProducts,
  getDailyViewData,
  getWeeklyViewData,
  getMonthlyViewData,
  getListingGrowthData,
  getSellerInsights
};
