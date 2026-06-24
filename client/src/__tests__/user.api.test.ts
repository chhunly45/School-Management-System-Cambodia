import api from '../services/api';
import { getUserProfile, updateUserProfile } from '../services/user.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() }
}));

describe('user.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getUserProfile calls api.get and returns data', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: { id: 'u1' } } });
    const res = await getUserProfile('u1');
    expect(api.get).toHaveBeenCalledWith('/users/profile/u1');
    expect(res).toEqual({ id: 'u1' });
  });

  it('updateUserProfile calls api.put and returns data', async () => {
    (api.put as jest.Mock).mockResolvedValue({ data: { data: { ok: true } } });
    const payload = { displayName: 'new' };
    const res = await updateUserProfile(payload);
    expect(api.put).toHaveBeenCalledWith('/users/profile', payload);
    expect(res).toEqual({ ok: true });
  });
});
