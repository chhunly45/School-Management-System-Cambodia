import api from './api';

export interface ReportPayload {
  targetType: 'product' | 'user';
  targetId: string;
  reason: 'scam' | 'fake_product' | 'duplicate_listing' | 'wrong_category' | 'other';
  details?: string;
}

export const createReport = async (payload: ReportPayload) => {
  const response = await api.post('/reports', payload);
  return response.data.data;
};

export const getMyReports = async () => {
  const response = await api.get('/reports/me');
  return response.data.data;
};
