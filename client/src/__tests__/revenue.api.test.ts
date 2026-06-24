// @ts-nocheck
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

const api = require('../services/api').default;
const revenueApi = require('../services/revenue.api');

describe('revenue.api', () => {
  afterEach(() => jest.resetAllMocks());

  it('getRevenueMetrics returns data', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { total: 100 } } });
    const res = await revenueApi.getRevenueMetrics();
    expect(res).toEqual({ total: 100 });
    expect(api.get).toHaveBeenCalledWith('/admin/revenue/metrics');
  });

  it('getDailyRevenue calls endpoint with params', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ date: '2026-01-01', amount: 10 }] } });
    const res = await revenueApi.getDailyRevenue({ limit: 1 });
    expect(res).toEqual([{ date: '2026-01-01', amount: 10 }]);
    expect(api.get).toHaveBeenCalledWith('/admin/revenue/daily', { params: { limit: 1 } });
  });
});
