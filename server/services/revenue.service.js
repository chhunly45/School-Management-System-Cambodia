const { Transaction } = require('../models');

const getRevenueMetrics = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const query = { status: 'completed', transactionType: 'sale' };

  const [totalRevenue, todayRevenue, weekRevenue, monthRevenue, yearRevenue] = await Promise.all([
    Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { ...query, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { ...query, createdAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { ...query, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { ...query, createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    todayRevenue: todayRevenue[0]?.total || 0,
    weekRevenue: weekRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    yearRevenue: yearRevenue[0]?.total || 0
  };
};

const getDailyRevenue = async ({ startDate, endDate, limit = 30 } = {}) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - limit));
  const end = endDate ? new Date(endDate) : new Date();

  const dailyData = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        transactionType: 'sale',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return dailyData;
};

const getWeeklyRevenue = async ({ startDate, endDate, limit = 12 } = {}) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7 * limit));
  const end = endDate ? new Date(endDate) : new Date();

  const weeklyData = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        transactionType: 'sale',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
        date: { $min: '$createdAt' }
      }
    },
    { $sort: { 'date': 1 } }
  ]);

  return weeklyData.map((item) => ({
    _id: `${item._id.year}-W${item._id.week}`,
    revenue: item.revenue,
    count: item.count,
    date: item.date
  }));
};

const getMonthlyRevenue = async ({ startDate, endDate, limit = 12 } = {}) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  const monthlyData = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        transactionType: 'sale',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
        date: { $min: '$createdAt' }
      }
    },
    { $sort: { 'date': 1 } }
  ]);

  return monthlyData.map((item) => ({
    _id: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    revenue: item.revenue,
    count: item.count,
    date: item.date
  }));
};

const getRevenueBySeller = async ({ startDate, endDate, limit = 50 } = {}) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  const sellerData = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        transactionType: 'sale',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$seller',
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'sellerInfo'
      }
    }
  ]);

  return sellerData.map((item) => ({
    sellerId: item._id,
    sellerName: item.sellerInfo[0]?.displayName || 'Unknown',
    sellerEmail: item.sellerInfo[0]?.email || '',
    revenue: item.revenue,
    transactionCount: item.count
  }));
};

module.exports = {
  getRevenueMetrics,
  getDailyRevenue,
  getWeeklyRevenue,
  getMonthlyRevenue,
  getRevenueBySeller
};
