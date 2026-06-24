const { Product, Chat, Favorite, Message } = require('../models');

/**
 * Get comprehensive seller analytics including metrics, charts, and performance
 */
const getSellerAnalytics = async (sellerId) => {
  const products = await Product.find({ seller: sellerId }).select('_id viewsCount status createdAt').lean();
  const productIds = products.map((p) => p._id);

  // Metrics
  const totalListings = products.length;
  const activeListings = products.filter((p) => p.status === 'published').length;
  const soldListings = products.filter((p) => p.status === 'sold').length;
  const totalProductViews = products.reduce((sum, p) => sum + (p.viewsCount || 0), 0);

  // Favorites count for all seller products
  const favoritesCount = productIds.length
    ? await Favorite.countDocuments({ product: { $in: productIds } })
    : 0;

  // Messages received (chats where seller is the seller)
  const messagesReceived = await Chat.countDocuments({ seller: sellerId });

  // Response rate: calculate based on messages received vs opened/read
  const chats = await Chat.find({ seller: sellerId }).select('unreadCount').lean();
  const readChats = chats.filter((c) => c.unreadCount === 0).length;
  const responseRate = chats.length > 0 ? Math.round((readChats / chats.length) * 100) : 0;

  // Average listing performance (views per listing)
  const avgListingPerformance = activeListings > 0 ? Math.round(totalProductViews / activeListings) : 0;

  // Performance score (0-100) based on views, favorites, messages, sold
  const performanceScore = calculatePerformanceScore({
    views: totalProductViews,
    favorites: favoritesCount,
    messages: messagesReceived,
    sold: soldListings,
    active: activeListings
  });

  // Seller tier based on performance score
  const sellerTier = getSellerTier(performanceScore);

  return {
    metrics: {
      totalListings,
      activeListings,
      soldListings,
      totalProductViews,
      favoritesCount,
      messagesReceived,
      responseRate,
      avgListingPerformance
    },
    performanceScore,
    sellerTier
  };
};

/**
 * Get top products by views, favorites, or messages
 */
const getTopProducts = async (sellerId, sortBy = 'views', limit = 10) => {
  const products = await Product.find({ seller: sellerId }).select('_id title viewsCount status').lean();
  const productIds = products.map((p) => p._id);

  let topProducts = [...products];

  if (sortBy === 'views') {
    topProducts.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (sortBy === 'favorites') {
    const favorites = await Favorite.find({ product: { $in: productIds } }).select('product').lean();
    const favoriteCount = {};
    favorites.forEach((f) => {
      favoriteCount[f.product] = (favoriteCount[f.product] || 0) + 1;
    });
    topProducts.sort((a, b) => (favoriteCount[b._id] || 0) - (favoriteCount[a._id] || 0));
  } else if (sortBy === 'messages') {
    const chats = await Chat.find({
      seller: sellerId,
      product: { $in: productIds }
    }).select('product').lean();
    const messageCount = {};
    chats.forEach((c) => {
      messageCount[c.product] = (messageCount[c.product] || 0) + 1;
    });
    topProducts.sort((a, b) => (messageCount[b._id] || 0) - (messageCount[a._id] || 0));
  }

  return topProducts.slice(0, limit).map((p) => ({
    _id: p._id,
    title: p.title,
    views: p.viewsCount || 0,
    status: p.status
  }));
};

/**
 * Get daily view data for seller products (estimated from product createdAt)
 */
const getDailyViewData = async (sellerId, limit = 30) => {
  const products = await Product.find({ seller: sellerId }).select('viewsCount createdAt').lean();

  // Simple estimation: distribute views evenly across days since creation
  const dailyData = {};
  products.forEach((p) => {
    const createdAt = new Date(p.createdAt);
    const daysActive = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyViews = Math.ceil((p.viewsCount || 0) / daysActive);
    const dateKey = createdAt.toISOString().split('T')[0];

    dailyData[dateKey] = (dailyData[dateKey] || 0) + dailyViews;
  });

  return Object.entries(dailyData)
    .slice(-limit)
    .map(([date, views]) => ({
      _id: date,
      views,
      products: 1
    }));
};

/**
 * Get weekly view data
 */
const getWeeklyViewData = async (sellerId, limit = 12) => {
  const products = await Product.find({ seller: sellerId }).select('viewsCount createdAt').lean();

  const weeklyData = {};
  products.forEach((p) => {
    const createdAt = new Date(p.createdAt);
    const weekNum = getWeekNumber(createdAt);
    const year = createdAt.getFullYear();
    const week = `${year}-W${String(weekNum).padStart(2, '0')}`;

    weeklyData[week] = (weeklyData[week] || 0) + (p.viewsCount || 0);
  });

  return Object.entries(weeklyData)
    .slice(-limit)
    .map(([week, views]) => ({
      _id: week,
      views,
      count: 1
    }));
};

/**
 * Get monthly view data
 */
const getMonthlyViewData = async (sellerId, limit = 12) => {
  const products = await Product.find({ seller: sellerId }).select('viewsCount createdAt').lean();

  const monthlyData = {};
  products.forEach((p) => {
    const createdAt = new Date(p.createdAt);
    const month = createdAt.toISOString().substring(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + (p.viewsCount || 0);
  });

  return Object.entries(monthlyData)
    .slice(-limit)
    .map(([month, views]) => ({
      _id: month,
      views,
      count: 1
    }));
};

/**
 * Get listing growth data (number of listings created per period)
 */
const getListingGrowthData = async (sellerId, limit = 30) => {
  const products = await Product.find({ seller: sellerId }).select('createdAt').lean();

  const growthData = {};
  products.forEach((p) => {
    const dateKey = new Date(p.createdAt).toISOString().split('T')[0];
    growthData[dateKey] = (growthData[dateKey] || 0) + 1;
  });

  return Object.entries(growthData)
    .slice(-limit)
    .map(([date, count]) => ({
      _id: date,
      count,
      cumulative: Object.entries(growthData)
        .filter(([d]) => d <= date)
        .reduce((sum, [, c]) => sum + c, 0)
    }));
};

/**
 * Get seller insights
 */
const getSellerInsights = async (sellerId) => {
  const products = await Product.find({ seller: sellerId })
    .select('_id title viewsCount status category createdAt')
    .populate('category', 'name labelKh')
    .lean();

  if (products.length === 0) {
    return {
      bestCategory: null,
      bestProduct: null,
      worstProduct: null,
      suggestedActions: ['Create your first listing to start tracking analytics']
    };
  }

  // Best category
  const categoryViews = {};
  products.forEach((p) => {
    const cat = p.category?.name || 'Other';
    categoryViews[cat] = (categoryViews[cat] || 0) + (p.viewsCount || 0);
  });
  const bestCategory = Object.entries(categoryViews).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  const bestCategoryCount = categoryViews[bestCategory];
  const totalViews = Object.values(categoryViews).reduce((sum, v) => sum + v, 0);
  const bestCategoryPercent = totalViews > 0 ? Math.round((bestCategoryCount / totalViews) * 100) : 0;

  // Best and worst products
  const activeProducts = products.filter((p) => p.status === 'published');
  const bestProduct = activeProducts.reduce((a, b) => (a.viewsCount > b.viewsCount ? a : b), null);
  const worstProduct = activeProducts.reduce((a, b) => (a.viewsCount < b.viewsCount ? a : b), null);

  const productIds = products.map((p) => p._id);
  const favoritesCount = productIds.length
    ? await Favorite.countDocuments({ product: { $in: productIds } })
    : 0;
  const soldListings = products.filter((p) => p.status === 'sold').length;

  const suggestions = [];
  if (activeProducts.length === 0) suggestions.push('Publish your first product to attract buyers');
  if (favoritesCount === 0) suggestions.push('Optimize product photos and descriptions to increase favorites');
  if (soldListings === 0) suggestions.push('Respond quickly to messages to close more sales');
  if (bestCategoryPercent > 0) suggestions.push(`Your ${bestCategory} listings receive ${bestCategoryPercent}% more views than other categories`);
  if (suggestions.length === 0) suggestions.push('Continue maintaining quality listings and responding to buyers');

  return {
    bestCategory,
    bestCategoryPercent,
    bestProduct: bestProduct ? { _id: bestProduct._id, title: bestProduct.title, views: bestProduct.viewsCount } : null,
    worstProduct: worstProduct ? { _id: worstProduct._id, title: worstProduct.title, views: worstProduct.viewsCount } : null,
    suggestedActions: suggestions
  };
};

// Helper functions

function calculatePerformanceScore(data) {
  const { views = 0, favorites = 0, messages = 0, sold = 0, active = 1 } = data;

  // Score components (weighted)
  const viewsScore = Math.min(views / 10, 25); // Max 25 points
  const favoritesScore = Math.min(favorites / 5, 25); // Max 25 points
  const messagesScore = Math.min(messages / 5, 25); // Max 25 points
  const soldScore = Math.min(sold * 5, 25); // Max 25 points

  const totalScore = Math.round(viewsScore + favoritesScore + messagesScore + soldScore);
  return Math.min(totalScore, 100);
}

function getSellerTier(score) {
  if (score >= 80) return 'Top Seller';
  if (score >= 60) return 'Gold Seller';
  if (score >= 40) return 'Silver Seller';
  return 'Bronze Seller';
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  getSellerAnalytics,
  getTopProducts,
  getDailyViewData,
  getWeeklyViewData,
  getMonthlyViewData,
  getListingGrowthData,
  getSellerInsights
};
