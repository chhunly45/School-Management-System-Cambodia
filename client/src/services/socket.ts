import { io } from 'socket.io-client';

const safeImportMetaEnv = () => {
  try {
    // eslint-disable-next-line no-eval
    return (eval('import.meta.env') as Record<string, string>) || {};
  } catch {
    return {} as Record<string, string>;
  }
};

const getSocketBaseUrl = () => {
  const env = safeImportMetaEnv();
  const rawUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || env.VITE_PUBLIC_API_URL || '';
  if (rawUrl) {
    return rawUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
  }

  return 'https://api.konpuk.com';
};

const baseURL = getSocketBaseUrl();

// DEBUG: log the env-derived socket URL so we can verify what the client will use at runtime
try {
  const env = safeImportMetaEnv();
  // eslint-disable-next-line no-console
  console.log('[socket] VITE_API_BASE_URL=', env.VITE_API_BASE_URL, ' -> baseURL=', baseURL);
  try {
    // also log the full socket.io endpoint URL we expect the client to use
    const socketEndpoint = new URL('/socket.io/', baseURL).toString();
    // eslint-disable-next-line no-console
    console.log('[socket] socket endpoint=', socketEndpoint);
  } catch (err) {
    // if baseURL isn't a valid URL, still log baseURL
    // eslint-disable-next-line no-console
    console.log('[socket] socket endpoint failed to parse, baseURL=', baseURL);
  }
} catch (e) {
  // ignore logging errors in unusual environments
}

// single socket instance (autoConnect: false)
const socket = io(baseURL, { autoConnect: false, transports: ['websocket'] });

export const connectSocket = (token?: string | null) => {
  const t = token || localStorage.getItem('authToken') || '';
  if (!socket.connected) {
    socket.auth = { token: t };
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const getSocket = () => socket;

