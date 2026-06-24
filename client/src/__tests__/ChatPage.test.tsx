import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as api from '../services/chat.api';
import * as socketService from '../services/socket';
import ChatPage from '../pages/ChatPage';

jest.mock('../services/chat.api');

const mockedChatApi = api as jest.Mocked<typeof api>;

function createSocketMock() {
  const listeners: Record<string, Function[]> = {};
  return {
    connected: false,
    auth: { token: '' },
    connect: jest.fn(function () {
      this.connected = true;
    }),
    disconnect: jest.fn(function () {
      this.connected = false;
    }),
    on: jest.fn((event: string, callback: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(callback);
    }),
    off: jest.fn((event: string) => {
      delete listeners[event];
    }),
    emit: jest.fn((event: string, data: any) => {
      if (event === 'send_message' && listeners['message_received']) {
        listeners['message_received'].forEach((cb: Function) => cb({
          _id: 'msg-1',
          chatId: 'chat1',
          sender: 'user1',
          content: 'Hello from socket',
          createdAt: '2025-01-01T00:00:00.000Z'
        }));
      }
    }),
    trigger: (event: string, data: any) => {
      (listeners[event] || []).forEach((cb: Function) => cb(data));
    }
  } as any;
}

jest.mock('../services/socket', () => {
  const socket = createSocketMock();
  return {
    connectSocket: jest.fn(() => socket),
    disconnectSocket: jest.fn(),
    getSocket: jest.fn(() => socket)
  };
});

const mockedSocket = (socketService as any).connectSocket();

const renderChatPage = async () => {
  render(
    <MemoryRouter initialEntries={['/messages/chat1']}>
      <Routes>
        <Route path="/messages/:id" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(mockedChatApi.listChats).toHaveBeenCalled());
};

describe('ChatPage message handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedChatApi.listChats.mockResolvedValue([
      {
        _id: 'chat1',
        buyer: { _id: 'user1', displayName: 'Buyer' },
        seller: { _id: 'user2', displayName: 'Seller' },
        product: { title: 'Product A' },
        unreadCount: 0,
        status: 'active'
      }
    ] as any);
    mockedChatApi.getChat.mockResolvedValue({
      chat: {
        _id: 'chat1',
        buyer: { _id: 'user1', displayName: 'Buyer' },
        seller: { _id: 'user2', displayName: 'Seller' },
        product: { title: 'Product A' }
      },
      messages: [
        {
          _id: 'msg-1',
          chatId: 'chat1',
          sender: 'user1',
          content: 'Hello there',
          createdAt: '2025-01-01T00:00:00.000Z'
        }
      ]
    } as any);
    mockedChatApi.markChatRead.mockResolvedValue({ data: { success: true } } as any);
  });

  it('does not duplicate messages when the same message is received twice', async () => {
    await renderChatPage();

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
    });

    mockedSocket.trigger('message_received', {
      _id: 'msg-1',
      chatId: 'chat1',
      sender: 'user1',
      content: 'Hello there',
      createdAt: '2025-01-01T00:00:00.000Z'
    });

    mockedSocket.trigger('message_received', {
      _id: 'msg-1',
      chatId: 'chat1',
      sender: 'user1',
      content: 'Hello there',
      createdAt: '2025-01-01T00:00:00.000Z'
    });

    await waitFor(() => {
      const renderedMessages = screen.getAllByText('Hello there');
      expect(renderedMessages.length).toBe(1);
    });
  });
});
