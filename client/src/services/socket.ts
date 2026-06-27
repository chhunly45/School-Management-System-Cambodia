import { io } from 'socket.io-client';

import { getViteEnv } from '../utils/viteEnv';

const getSocketBaseUrl = () => {
  const rawUrl = getViteEnv('VITE_API_BASE_URL', '') || getViteEnv('VITE_API_URL', '') || getViteEnv('VITE_PUBLIC_API_URL', '');
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

