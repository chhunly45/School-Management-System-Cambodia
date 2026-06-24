import api from './api';

export const getRevenueMetrics = async () => {
  const response = await api.get('/admin/revenue/metrics');
  return response.data.data;
};

export const getDailyRevenue = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/revenue/daily', { params });
  return response.data.data;
};

export const getWeeklyRevenue = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/revenue/weekly', { params });
  return response.data.data;
};

export const getMonthlyRevenue = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/revenue/monthly', { params });
  return response.data.data;
};

export const getRevenueBySeller = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/revenue/by-seller', { params });
  return response.data.data;
};
