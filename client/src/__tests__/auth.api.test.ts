import api from '../services/api';
import * as auth from '../services/auth.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn(), put: jest.fn() }
}));

describe('auth.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('register returns email verification response when provided', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true, data: { requiresEmailVerification: true, identifier: 'id' } } });
    const res = await auth.register({ displayName: 'A', password: 'p', phoneNumber: 'p' } as any);
    expect(res).toEqual({ requiresEmailVerification: true, identifier: 'id' });
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('register stores tokens on success', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true, data: { accessToken: 't1', refreshToken: 'r1', user: { id: 'u1' } } } });
    const res = await auth.register({ displayName: 'A', password: 'p', phoneNumber: 'p' } as any);
    expect(localStorage.getItem('authToken')).toBe('t1');
    expect(localStorage.getItem('refreshToken')).toBe('r1');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual({ id: 'u1' });
    expect(res).toEqual({ accessToken: 't1', refreshToken: 'r1', user: { id: 'u1' } });
  });

  it('login returns OTP response when requiresOtp', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true, data: { requiresOtp: true, expiresIn: 10 } } });
    const res = await auth.login({ identifier: 'a', password: 'b' } as any);
    expect(res).toEqual({ requiresOtp: true, expiresIn: 10 });
  });

  it('getProfile caches results', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { data: { id: 'me' } } });
    const p1 = await auth.getProfile();
    const p2 = await auth.getProfile();
    expect(p1).toEqual({ id: 'me' });
    expect(p2).toEqual({ id: 'me' });
    expect((api.get as jest.Mock).mock.calls.length).toBe(1);
  });

  it('logout rejects when api.post fails and does not clear storage', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('fail'));
    localStorage.setItem('refreshToken', 'r');
    localStorage.setItem('authToken', 'a');
    localStorage.setItem('user', JSON.stringify({}));
    await expect(auth.logout()).rejects.toThrow('fail');
    // storage remains because logout did not complete
    expect(localStorage.getItem('authToken')).toBe('a');
    expect(localStorage.getItem('refreshToken')).toBe('r');
  });

  it('logout clears storage on success', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    localStorage.setItem('refreshToken', 'r');
    localStorage.setItem('authToken', 'a');
    localStorage.setItem('user', JSON.stringify({}));
    await expect(auth.logout()).resolves.toBeUndefined();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
