import axios from 'axios';

import { getViteEnv } from '../utils/viteEnv';

const resolvedApiBaseUrl = getViteEnv('VITE_API_BASE_URL', 'http://localhost:5000/api');

const created = axios.create({
  baseURL: resolvedApiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Some test environments mock `axios.create` and may return undefined — provide a safe fallback
const api =
  created ||
  ({} as any) as {
    interceptors: { request?: { use?: Function }; response?: { use?: Function } };
    get: (...args: any[]) => Promise<any>;
    post: (...args: any[]) => Promise<any>;
    put: (...args: any[]) => Promise<any>;
    delete: (...args: any[]) => Promise<any>;
  };

if (!api.interceptors) {
  api.interceptors = { request: { use: () => {} }, response: { use: () => {} } } as any;
}

let csrfToken: string | null = null;

const fetchCsrfToken = async () => {
  const response = await api.get('/csrf-token');
  csrfToken = response.data.csrfToken;
  return csrfToken;
};

const clearExpiredSession = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('sessionExpired'));
};

const redirectToLogin = () => {
  const url = new URL(window.location.href);
  url.pathname = '/login';
  url.searchParams.set('sessionExpired', '1');
  window.location.href = url.toString();
};

if (api.interceptors && api.interceptors.request && typeof api.interceptors.request.use === 'function') {
  api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('authToken');
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  });
}

if (api.interceptors && api.interceptors.response && typeof api.interceptors.response.use === 'function') {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const response = error?.response;
      const message = response?.data?.message;
      if (
        response?.status === 401 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('invalid or expired')
      ) {
        clearExpiredSession();
        redirectToLogin();
      }
      return Promise.reject(error);
    }
  );
}

export default api;
