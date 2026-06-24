jest.mock('socket.io-client', () => {
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();
  const socket = {
    connected: false,
    auth: { token: '' },
    connect: mockConnect,
    disconnect: mockDisconnect
  };

  return {
    io: jest.fn(() => socket)
  };
});

import { connectSocket, disconnectSocket } from '../services/socket';
import { io } from 'socket.io-client';

describe('socket service', () => {
  it('connects and disconnects the socket', () => {
    const fakeSocket = (io as jest.Mock).mock.results[0].value;

    connectSocket();
    expect(fakeSocket.connect).toHaveBeenCalled();

    fakeSocket.connected = true;
    disconnectSocket();
    expect(fakeSocket.disconnect).toHaveBeenCalled();
  });
});
