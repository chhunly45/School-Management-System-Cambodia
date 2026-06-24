import api from '../services/api';
import * as fav from '../services/favorites.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() }
}));

describe('favorites.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getFavorites returns list', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [{ _id: '1' }] } });
    const res = await fav.getFavorites();
    expect(res).toEqual([{ _id: '1' }]);
  });

  it('getFavoriteIds maps ids', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: [{ _id: '1' }, { _id: '2' }] } });
    const ids = await fav.getFavoriteIds();
    expect(ids).toEqual(['1', '2']);
  });

  it('getFavoritesCount returns number', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: { count: 7 } } });
    const c = await fav.getFavoritesCount();
    expect(c).toBe(7);
  });

  it('checkFavorite returns boolean', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { data: { isFavorite: true } } });
    const v = await fav.checkFavorite('p1');
    expect(api.get).toHaveBeenCalledWith('/favorites/check/p1');
    expect(v).toBe(true);
  });

  it('addFavorite and removeFavorite call api', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { data: { ok: true } } });
    const a = await fav.addFavorite('p2');
    expect(api.post).toHaveBeenCalledWith('/favorites/p2');
    expect(a).toEqual({ ok: true });

    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { data: { ok: true } } });
    const r = await fav.removeFavorite('p2');
    expect(api.delete).toHaveBeenCalledWith('/favorites/p2');
    expect(r).toEqual({ ok: true });
  });
});
