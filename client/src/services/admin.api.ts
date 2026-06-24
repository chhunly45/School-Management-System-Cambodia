import api from './api';

export const getAdminOverview = async () => {
  const response = await api.get('/admin/overview');
  return response.data.data;
};

export const getAdminUsers = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data.data;
};

export const updateAdminUserStatus = async (userId: string, updates: { isActive?: boolean; role?: string; verified?: boolean; verificationStatus?: string; sellerVerificationStatus?: string }) => {
  const response = await api.patch(`/admin/users/${userId}/status`, updates);
  return response.data.data;
};

export const getAdminProducts = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/products', { params });
  return response.data.data;
};

export const updateAdminProductStatus = async (productId: string, status: string) => {
  const response = await api.patch(`/admin/products/${productId}/status`, { status });
  return response.data.data;
};

export const updateAdminProductFeatured = async (productId: string, featured: boolean) => {
  const response = await api.patch(`/admin/products/${productId}/featured`, { featured });
  return response.data.data;
};

export const getAdminReports = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/reports', { params });
  return response.data.data;
};

export const updateAdminReportStatus = async (reportId: string, status: string) => {
  const response = await api.patch(`/admin/reports/${reportId}`, { status });
  return response.data.data;
};

export const getAdminAuditLogs = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data.data;
};

export const deleteAdminReview = async (reviewId: string) => {
  const response = await api.delete(`/admin/reviews/${reviewId}`);
  return response.data.data;
};

export const getProductsByProvince = async () => {
  const response = await api.get('/admin/analytics/products-by-province');
  return response.data.data;
};
