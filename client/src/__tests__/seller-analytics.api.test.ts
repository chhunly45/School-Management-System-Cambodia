import api from '../services/api';
import * as svc from '../services/seller-analytics.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('seller-analytics.api', () => {
  afterEach(() => mockedApi.get.mockReset());

  test('getSellerAnalytics returns data', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: { stats: 1 } } } as any);
    const res = await svc.getSellerAnalytics();
    expect(res).toEqual({ stats: 1 });
    expect(mockedApi.get).toHaveBeenCalledWith('/seller-analytics');
  });

  test('getTopProducts calls endpoint with params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } } as any);
    const res = await svc.getTopProducts('sales', 5);
    expect(res).toEqual([{ id: 1 }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/seller-analytics/top-products', { params: { sortBy: 'sales', limit: 5 } });
  });

  test('other analytics functions return data and pass params', async () => {
    mockedApi.get.mockResolvedValue({ data: { data: [1, 2, 3] } } as any);
    await expect(svc.getDailyViewData(7)).resolves.toEqual([1, 2, 3]);
    await expect(svc.getWeeklyViewData(4)).resolves.toEqual([1, 2, 3]);
    await expect(svc.getMonthlyViewData(3)).resolves.toEqual([1, 2, 3]);
    await expect(svc.getListingGrowthData(10)).resolves.toEqual([1, 2, 3]);
    expect(mockedApi.get).toHaveBeenCalled();
  });
});
