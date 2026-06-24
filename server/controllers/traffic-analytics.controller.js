const trafficService = require('../services/traffic-analytics.service');

const getTrafficMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await trafficService.getTrafficMetrics(startDate, endDate);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getSearchAnalytics = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const analytics = await trafficService.getSearchAnalytics(Number(limit), startDate, endDate);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

const getTopContent = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    const content = await trafficService.getTopContent(Number(limit), startDate, endDate);
    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

const getTrafficTrends = async (req, res, next) => {
  try {
    const { period = 'daily', limit = 30, startDate, endDate } = req.query;
    const trends = await trafficService.getTrafficTrends(period, Number(limit), startDate, endDate);
    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

const getSearchGrowth = async (req, res, next) => {
  try {
    const { period = 'daily', limit = 30, startDate, endDate } = req.query;
    const growth = await trafficService.getSearchGrowth(period, Number(limit), startDate, endDate);
    res.json({ success: true, data: growth });
  } catch (error) {
    next(error);
  }
};

const getVisitorGrowth = async (req, res, next) => {
  try {
    const { period = 'daily', limit = 30, startDate, endDate } = req.query;
    const growth = await trafficService.getVisitorGrowth(period, Number(limit), startDate, endDate);
    res.json({ success: true, data: growth });
  } catch (error) {
    next(error);
  }
};

const getTrafficInsights = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const insights = await trafficService.getTrafficInsights(startDate, endDate);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrafficMetrics,
  getSearchAnalytics,
  getTopContent,
  getTrafficTrends,
  getSearchGrowth,
  getVisitorGrowth,
  getTrafficInsights
};
