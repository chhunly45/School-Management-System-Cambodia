// @ts-nocheck
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

const api = require('../services/api').default;
const ta = require('../services/traffic-analytics.api');

describe('traffic-analytics.api', () => {
  afterEach(() => jest.resetAllMocks());

  it('getTrafficMetrics calls metrics endpoint with dates', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { visits: 10 } } });
    const res = await ta.getTrafficMetrics('2026-01-01', '2026-01-31');
    expect(res).toEqual({ visits: 10 });
    expect(api.get).toHaveBeenCalledWith('/traffic-analytics/metrics', { params: { startDate: '2026-01-01', endDate: '2026-01-31' } });
  });

  it('getTopContent calls top-content with limit', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'c1' }] } });
    const res = await ta.getTopContent(5);
    expect(res).toEqual([{ id: 'c1' }]);
    expect(api.get).toHaveBeenCalledWith('/traffic-analytics/top-content', { params: { limit: 5, startDate: undefined, endDate: undefined } });
  });
});
