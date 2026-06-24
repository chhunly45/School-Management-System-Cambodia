import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { authToken, isAuthenticated } = useAuth();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      socketRef.current = connectSocket(authToken);
    } else {
      disconnectSocket();
      socketRef.current = null;
    }

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [authToken, isAuthenticated]);

  return {
    socket: getSocket(),
  };
};

export default useSocket;
