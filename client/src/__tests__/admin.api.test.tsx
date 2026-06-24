import api from '../services/api';
import * as adminApi from '../services/admin.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('admin API wrappers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches admin overview data', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { users: 5 } } });
    const data = await adminApi.getAdminOverview();
    expect(data).toEqual({ users: 5 });
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/overview');
  });

  it('fetches admin users and products and updates statuses', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: '1' }] } });
    const users = await adminApi.getAdminUsers({ page: 1 });
    expect(users).toEqual([{ id: '1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/users', { params: { page: 1 } });

    mockedApi.patch.mockResolvedValueOnce({ data: { data: { isActive: false } } });
    const status = await adminApi.updateAdminUserStatus('1', { isActive: false });
    expect(status).toEqual({ isActive: false });
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/users/1/status', { isActive: false });

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: '2' }] } });
    const products = await adminApi.getAdminProducts({ page: 2 });
    expect(products).toEqual([{ id: '2' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/products', { params: { page: 2 } });

    mockedApi.patch.mockResolvedValueOnce({ data: { data: { status: 'approved' } } });
    const productStatus = await adminApi.updateAdminProductStatus('2', 'approved');
    expect(productStatus).toEqual({ status: 'approved' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/products/2/status', { status: 'approved' });

    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: '10' }] } });
    const reports = await adminApi.getAdminReports({ sort: 'new' });
    expect(reports).toEqual([{ id: '10' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports', { params: { sort: 'new' } });

    mockedApi.patch.mockResolvedValueOnce({ data: { data: { status: 'resolved' } } });
    const reportStatus = await adminApi.updateAdminReportStatus('10', 'resolved');
    expect(reportStatus).toEqual({ status: 'resolved' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/reports/10', { status: 'resolved' });
  });

  it('fetches admin audit logs', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: '100' }] } });
    const auditLogs = await adminApi.getAdminAuditLogs({ page: 1 });
    expect(auditLogs).toEqual([{ id: '100' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/audit-logs', { params: { page: 1 } });
  });

  it('updates product featured status', async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { data: { featured: true } } });
    const result = await adminApi.updateAdminProductFeatured('2', true);
    expect(result).toEqual({ featured: true });
    expect(mockedApi.patch).toHaveBeenCalledWith('/admin/products/2/featured', { featured: true });
  });

  it('deletes an admin review', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: { data: { success: true } } });
    const result = await adminApi.deleteAdminReview('5');
    expect(result).toEqual({ success: true });
    expect(mockedApi.delete).toHaveBeenCalledWith('/admin/reviews/5');
  });

  it('fetches products by province analytics', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ province: 'Phnom Penh', count: 42 }] } });
    const data = await adminApi.getProductsByProvince();
    expect(data).toEqual([{ province: 'Phnom Penh', count: 42 }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/analytics/products-by-province');
  });

  it('propagates API errors for deleteAdminReview', async () => {
    mockedApi.delete.mockRejectedValueOnce(new Error('delete failed'));
    await expect(adminApi.deleteAdminReview('5')).rejects.toThrow('delete failed');
    expect(mockedApi.delete).toHaveBeenCalledWith('/admin/reviews/5');
  });
});
