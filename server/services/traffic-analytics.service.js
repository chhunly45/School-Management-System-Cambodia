const { PageView, Search, Visitor, Product, Category, User } = require('../models');

/**
 * Get traffic metrics overview
 */
const getTrafficMetrics = async (startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Total visits
  const totalVisits = await PageView.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  // Unique visitors
  const uniqueVisitors = await Visitor.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  // Returning visitors
  const returningVisitors = await Visitor.countDocuments({
    isReturning: true,
    createdAt: { $gte: start, $lte: end }
  });

  // Page views by type
  const pageViewsByType = await PageView.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$pageType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Total searches
  const totalSearches = await Search.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  // Average session duration
  const avgSessionDuration = await Visitor.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, avgTime: { $avg: '$totalTimeOnSite' } } }
  ]);

  // Bounce rate (sessions with only 1 page view)
  const totalSessions = await Visitor.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  const bouncedSessions = await Visitor.countDocuments({
    pageViews: 1,
    createdAt: { $gte: start, $lte: end }
  });

  const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

  const pageViewsByTypeObj = {};
  pageViewsByType.forEach((item) => {
    pageViewsByTypeObj[item._id] = item.count;
  });

  return {
    totalVisits,
    uniqueVisitors,
    returningVisitors,
    newVisitors: uniqueVisitors - returningVisitors,
    totalSearches,
    pageViewsByType: pageViewsByTypeObj,
    bounceRate,
    avgSessionDuration: Math.round(avgSessionDuration[0]?.avgTime || 0)
  };
};

/**
 * Get search analytics
 */
const getSearchAnalytics = async (limit = 10, startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Most searched keywords
  const mostSearchedKeywords = await Search.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$resultCount' } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { keyword: '$_id', searches: '$count', avgResults: { $round: ['$avgResults', 0] }, _id: 0 } }
  ]);

  // Searches with no results
  const noResultsSearches = await Search.aggregate([
    { $match: { resultCount: 0, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { keyword: '$_id', count: '$count', _id: 0 } }
  ]);

  // Category search trends
  const categorySearchTrends = await Search.aggregate([
    { $match: { category: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$category', searches: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
    { $unwind: '$categoryInfo' },
    { $sort: { searches: -1 } },
    { $limit: limit },
    { $project: { category: '$categoryInfo.name', categoryKh: '$categoryInfo.labelKh', searches: '$searches', _id: 0 } }
  ]);

  return {
    mostSearchedKeywords,
    noResultsSearches,
    categorySearchTrends
  };
};

/**
 * Get top content
 */
const getTopContent = async (limit = 10, startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Most viewed products
  const mostViewedProducts = await PageView.aggregate([
    { $match: { pageType: 'product', productId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$productId', views: { $sum: 1 } } },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $sort: { views: -1 } },
    { $limit: limit },
    { $project: { _id: '$product._id', title: '$product.title', views: '$views' } }
  ]);

  // Most viewed categories
  const mostViewedCategories = await PageView.aggregate([
    { $match: { pageType: 'category', categoryId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', views: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $sort: { views: -1 } },
    { $limit: limit },
    { $project: { _id: '$category._id', name: '$category.name', views: '$views' } }
  ]);

  // Most viewed seller profiles
  const mostViewedSellers = await PageView.aggregate([
    { $match: { pageType: 'seller_profile', sellerId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$sellerId', views: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
    { $unwind: '$seller' },
    { $sort: { views: -1 } },
    { $limit: limit },
    { $project: { _id: '$seller._id', displayName: '$seller.displayName', views: '$views' } }
  ]);

  // Most active sellers (by product views)
  const mostActiveSellers = await PageView.aggregate([
    { $match: { pageType: 'product', createdAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $group: { _id: '$product.seller', productViews: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
    { $unwind: '$seller' },
    { $sort: { productViews: -1 } },
    { $limit: limit },
    { $project: { _id: '$seller._id', displayName: '$seller.displayName', productViews: '$productViews' } }
  ]);

  return {
    mostViewedProducts,
    mostViewedCategories,
    mostViewedSellers,
    mostActiveSellers
  };
};

/**
 * Get traffic trends (daily/weekly/monthly)
 */
const getTrafficTrends = async (period = 'daily', limit = 30, startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - limit * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let groupFormat = '%Y-%m-%d'; // daily
  if (period === 'weekly') {
    groupFormat = '%Y-W%U';
  } else if (period === 'monthly') {
    groupFormat = '%Y-%m';
  }

  const trends = await PageView.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        pageViews: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        date: '$_id',
        pageViews: '$pageViews',
        uniqueVisitors: { $size: '$uniqueVisitors' },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  return trends;
};

/**
 * Get search growth trends
 */
const getSearchGrowth = async (period = 'daily', limit = 30, startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - limit * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let groupFormat = '%Y-%m-%d'; // daily
  if (period === 'weekly') {
    groupFormat = '%Y-W%U';
  } else if (period === 'monthly') {
    groupFormat = '%Y-%m';
  }

  const growth = await Search.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        searches: { $sum: 1 },
        noResultsCount: {
          $sum: { $cond: [{ $eq: ['$resultCount', 0] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        date: '$_id',
        searches: '$searches',
        noResults: '$noResultsCount',
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  return growth;
};

/**
 * Get visitor growth trends
 */
const getVisitorGrowth = async (period = 'daily', limit = 30, startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - limit * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let groupFormat = '%Y-%m-%d'; // daily
  if (period === 'weekly') {
    groupFormat = '%Y-W%U';
  } else if (period === 'monthly') {
    groupFormat = '%Y-%m';
  }

  const growth = await Visitor.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        totalVisitors: { $sum: 1 },
        returningCount: { $sum: { $cond: ['$isReturning', 1, 0] } },
        newCount: { $sum: { $cond: [{ $eq: ['$isReturning', false] }, 1, 0] } }
      }
    },
    {
      $project: {
        date: '$_id',
        totalVisitors: '$totalVisitors',
        returning: '$returningCount',
        new: '$newCount',
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);

  return growth;
};

/**
 * Get traffic insights
 */
const getTrafficInsights = async (startDate = null, endDate = null) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const insights = [];

  // Fastest growing category
  const categoryGrowth = await PageView.aggregate([
    { $match: { pageType: 'category', categoryId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', views: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $sort: { views: -1 } },
    { $limit: 1 },
    { $project: { name: '$category.name', views: '$views', _id: 0 } }
  ]);

  if (categoryGrowth.length > 0) {
    insights.push({
      type: 'fastest_growing',
      title: 'Fastest Growing Category',
      description: `${categoryGrowth[0].name} has received ${categoryGrowth[0].views} views this period`
    });
  }

  // Most popular search
  const popularSearch = await Search.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    { $project: { keyword: '$_id', count: '$count', _id: 0 } }
  ]);

  if (popularSearch.length > 0) {
    insights.push({
      type: 'popular_search',
      title: 'Most Popular Search',
      description: `"${popularSearch[0].keyword}" was searched ${popularSearch[0].count} times`
    });
  }

  // Highest traffic product
  const topProduct = await PageView.aggregate([
    { $match: { pageType: 'product', productId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$productId', views: { $sum: 1 } } },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $sort: { views: -1 } },
    { $limit: 1 },
    { $project: { title: '$product.title', views: '$views', _id: 0 } }
  ]);

  if (topProduct.length > 0) {
    insights.push({
      type: 'top_product',
      title: 'Highest Traffic Product',
      description: `"${topProduct[0].title}" received ${topProduct[0].views} views`
    });
  }

  // Highest traffic seller
  const topSeller = await PageView.aggregate([
    { $match: { pageType: 'seller_profile', sellerId: { $ne: null }, createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$sellerId', views: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'seller' } },
    { $unwind: '$seller' },
    { $sort: { views: -1 } },
    { $limit: 1 },
    { $project: { displayName: '$seller.displayName', views: '$views', _id: 0 } }
  ]);

  if (topSeller.length > 0) {
    insights.push({
      type: 'top_seller',
      title: 'Highest Traffic Seller',
      description: `${topSeller[0].displayName} received ${topSeller[0].views} profile views`
    });
  }

  return insights;
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
