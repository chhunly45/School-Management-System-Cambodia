import api from './api';

export const getTrafficMetrics = async (startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/metrics', {
    params: { startDate, endDate }
  });
  return response.data.data;
};

export const getSearchAnalytics = async (limit = 10, startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/search', {
    params: { limit, startDate, endDate }
  });
  return response.data.data;
};

export const getTopContent = async (limit = 10, startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/top-content', {
    params: { limit, startDate, endDate }
  });
  return response.data.data;
};

export const getTrafficTrends = async (period = 'daily', limit = 30, startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/trends', {
    params: { period, limit, startDate, endDate }
  });
  return response.data.data;
};

export const getSearchGrowth = async (period = 'daily', limit = 30, startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/search-growth', {
    params: { period, limit, startDate, endDate }
  });
  return response.data.data;
};

export const getVisitorGrowth = async (period = 'daily', limit = 30, startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/visitor-growth', {
    params: { period, limit, startDate, endDate }
  });
  return response.data.data;
};

export const getTrafficInsights = async (startDate?: string, endDate?: string) => {
  const response = await api.get('/traffic-analytics/insights', {
    params: { startDate, endDate }
  });
  return response.data.data;
};
