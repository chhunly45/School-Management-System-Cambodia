import api from '../services/api';
import * as auth from '../services/auth.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('auth.api branches', () => {
  const origLocalStorage = global.localStorage;
  let mockLocalStorage: any;

  beforeEach(() => {
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn((k: string) => { delete store[k]; }),
    } as any;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      value: mockLocalStorage,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        enumerable: true,
        value: mockLocalStorage,
      });
    }

    // clear any cached values on getProfile
    (auth.getProfile as any)._cache = undefined;
    (auth.getProfile as any)._cacheAt = 0;
    mockedApi.post.mockReset();
    mockedApi.get.mockReset();
    mockedApi.put && mockedApi.put.mockReset && mockedApi.put.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      value: origLocalStorage,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        enumerable: true,
        value: origLocalStorage,
      });
    }
    jest.resetAllMocks();
  });

  test('login success stores tokens and user', async () => {
    const data = { user: { id: 'u1', displayName: 'U' }, accessToken: 'a', refreshToken: 'r' };
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data } } as any);
    const res = await auth.login({ identifier: 'i', password: 'p' });
    expect(res).toEqual(data);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'a');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'r');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(data.user));
  });

  test('login returns otp flow when requiresOtp present', async () => {
    const otp = { requiresOtp: true, expiresIn: 60 } as any;
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: otp } } as any);
    const res = await auth.login({ identifier: 'i', password: 'p' });
    expect(res).toEqual(otp);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('register returns email verification flow', async () => {
    const verify = { requiresEmailVerification: true, identifier: 'x' } as any;
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: verify } } as any);
    const res = await auth.register({ displayName: 'n', password: 'p', phoneNumber: 'ph' } as any);
    expect(res).toEqual(verify);
  });

  test('register success stores tokens when returned in different fields', async () => {
    const payload = { user: { id: 'u2' }, token: 'tok', refreshToken: 'r2' } as any;
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: payload } } as any);
    const res = await auth.register({ displayName: 'n', password: 'p', phoneNumber: 'ph' } as any);
    expect(res).toEqual(payload);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'tok');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'r2');
  });

  test('logout success removes tokens and calls API with refreshToken', async () => {
    mockLocalStorage.getItem.mockImplementation((k: string) => k === 'refreshToken' ? 'r1' : null);
    mockedApi.post.mockResolvedValueOnce({ data: { success: true } } as any);
    await auth.logout();
    expect(mockedApi.post).toHaveBeenCalled();
    const payload = mockedApi.post.mock.calls[0][1] as any;
    expect(payload.refreshToken).toBe('r1');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
  });

  test('logout propagates error and does not remove items when API fails', async () => {
    mockLocalStorage.getItem.mockImplementation((k: string) => k === 'refreshToken' ? 'r1' : null);
    mockedApi.post.mockRejectedValueOnce(new Error('fail'));
    await expect(auth.logout()).rejects.toThrow('fail');
    // mock removeItem should not have been called on failure
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  test('refreshAuthToken success updates tokens from multiple possible fields', async () => {
    mockLocalStorage.getItem.mockImplementation((k: string) => k === 'refreshToken' ? 'r_old' : null);
    const responseData = { accessToken: 'newA', refreshToken: 'newR' };
    mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: responseData } } as any);
    const res = await auth.refreshAuthToken();
    expect(res).toEqual(responseData);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'newA');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'newR');
  });

  test('refreshAuthToken returns undefined data when response not successful', async () => {
    mockLocalStorage.getItem.mockImplementation((k: string) => k === 'refreshToken' ? 'r_old' : null);
    mockedApi.post.mockResolvedValueOnce({ data: { success: false, data: undefined } } as any);
    const res = await auth.refreshAuthToken();
    expect(res).toBeUndefined();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('getProfile uses cache on subsequent calls', async () => {
    const data = { id: 'me' };
    mockedApi.get.mockResolvedValueOnce({ data: { data } } as any);
    const first = await auth.getProfile();
    const second = await auth.getProfile();
    expect(first).toEqual(data);
    expect(second).toEqual(data);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });

  test('getProfile throws when API errors', async () => {
    // clear cache so it actually calls API
    (auth.getProfile as any)._cache = undefined;
    (auth.getProfile as any)._cacheAt = 0;
    mockedApi.get.mockRejectedValueOnce(new Error('net'));
    await expect(auth.getProfile()).rejects.toThrow('net');
  });
});
