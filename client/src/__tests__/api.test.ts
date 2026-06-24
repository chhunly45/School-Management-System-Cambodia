import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockUse = jest.fn();
const mockCreate = jest.fn().mockReturnValue({
  interceptors: {
    request: {
      use: mockUse
    }
  }
});

mockedAxios.create = mockCreate as any;

describe('API service configuration', () => {
  it('creates an axios instance with default configuration and registers interceptors', async () => {
    const apiModule = await import('../services/api');
    const api = apiModule.default;

    expect(mockCreate).toHaveBeenCalledWith({
      baseURL: 'http://localhost:4000/api',
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    expect(mockUse).toHaveBeenCalled();
    expect(api).toBeDefined();
  });

  it('attaches auth and CSRF headers for mutating requests', async () => {
    const apiModule = await import('../services/api');
    const api = apiModule.default as any;
    const mockGet = jest.fn().mockResolvedValue({ data: { csrfToken: 'csrf-123' } });
    api.get = mockGet;

    const requestInterceptor = mockUse.mock.calls[0][0];
    localStorage.setItem('authToken', 'jwt-token');

    const config = { headers: {}, method: 'post' } as any;
    const result = await requestInterceptor(config);

    expect(mockGet).toHaveBeenCalledWith('/csrf-token');
    expect(result.headers.Authorization).toBe('Bearer jwt-token');
    expect(result.headers['X-CSRF-Token']).toBe('csrf-123');
  });

  it('returns config unchanged for non-mutating requests', async () => {
    const requestInterceptor = mockUse.mock.calls[0][0];

    const config = { headers: {}, method: 'get' } as any;
    const result = await requestInterceptor(config);

    expect(result).toEqual(config);
  });
});
