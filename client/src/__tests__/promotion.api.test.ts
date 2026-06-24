import * as promoApi from '../services/promotion.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  }
}));

import api from '../services/api';

describe('promotion.api', () => {
  afterEach(() => jest.resetAllMocks());

  it('getPromotionPlans returns plans', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [{ id: 'p1', label: 'Featured', durationDays: 7, price: 5, currency: 'USD' }] } });
    const plans = await promoApi.getPromotionPlans();
    expect(plans).toEqual([{ id: 'p1', label: 'Featured', durationDays: 7, price: 5, currency: 'USD' }]);
    expect(api.get).toHaveBeenCalledWith('/promotions/plans');
  });

  it('purchasePromotion posts product and plan ids', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: { success: true } } });
    const res = await promoApi.purchasePromotion('prod1', 'p1');
    expect(res).toEqual({ success: true });
    expect(api.post).toHaveBeenCalledWith('/promotions/purchase', { productId: 'prod1', planId: 'p1' });
  });

  it('approvePromotion calls patch and returns data', async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ data: { data: { approved: true } } });
    const res = await promoApi.approvePromotion('prom1');
    expect(res).toEqual({ approved: true });
    expect(api.patch).toHaveBeenCalledWith('/admin/promotions/prom1/approve');
  });
});
