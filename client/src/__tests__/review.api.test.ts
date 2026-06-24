// @ts-nocheck
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

const api = require('../services/api').default;
const reviewApi = require('../services/review.api');

describe('review.api', () => {
  afterEach(() => jest.resetAllMocks());

  it('createReview posts payload and returns item', async () => {
    const payload = { seller: 's1', rating: 5, comment: 'Great' };
    api.post.mockResolvedValueOnce({ data: { data: { _id: 'r1', seller: 's1', rating: 5, comment: 'Great' } } });
    const res = await reviewApi.createReview(payload);
    expect(res).toEqual({ _id: 'r1', seller: 's1', rating: 5, comment: 'Great' });
    expect(api.post).toHaveBeenCalledWith('/reviews', payload);
  });

  it('getSellerReviews calls endpoint with params', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { items: [], meta: { page: 1, limit: 10, total: 0 }, summary: { avgRating: 0, totalReviews: 0 } } } });
    const res = await reviewApi.getSellerReviews('seller1', { page: 1 });
    expect(res).toHaveProperty('items');
    expect(api.get).toHaveBeenCalledWith('/reviews/seller/seller1', { params: { page: 1 } });
  });
});
