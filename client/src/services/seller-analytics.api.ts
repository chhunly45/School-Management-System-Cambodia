import api from './api';

export const getSellerAnalytics = async () => {
  const response = await api.get('/seller-analytics');
  return response.data.data;
};

export const getTopProducts = async (sortBy = 'views', limit = 10) => {
  const response = await api.get('/seller-analytics/top-products', {
    params: { sortBy, limit }
  });
  return response.data.data;
};

export const getDailyViewData = async (limit = 30) => {
  const response = await api.get('/seller-analytics/daily-views', {
    params: { limit }
  });
  return response.data.data;
};

export const getWeeklyViewData = async (limit = 12) => {
  const response = await api.get('/seller-analytics/weekly-views', {
    params: { limit }
  });
  return response.data.data;
};

export const getMonthlyViewData = async (limit = 12) => {
  const response = await api.get('/seller-analytics/monthly-views', {
    params: { limit }
  });
  return response.data.data;
};

export const getListingGrowthData = async (limit = 30) => {
  const response = await api.get('/seller-analytics/growth', {
    params: { limit }
  });
  return response.data.data;
};

export const getSellerInsights = async () => {
  const response = await api.get('/seller-analytics/insights');
  return response.data.data;
};
