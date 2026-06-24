import api from '../services/api';
import * as chatApi from '../services/chat.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('chat API wrappers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists chats and fetches chat details', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: 'chat1' }] } });
    const chats = await chatApi.listChats();
    expect(chats).toEqual([{ id: 'chat1' }]);
    expect(mockedApi.get).toHaveBeenCalledWith('/chats');

    mockedApi.get.mockResolvedValueOnce({ data: { data: { id: 'chat1' } } });
    const chat = await chatApi.getChat('chat1');
    expect(chat).toEqual({ id: 'chat1' });
    expect(mockedApi.get).toHaveBeenCalledWith('/chats/chat1');
  });

  it('creates a chat, sends a message and marks chat as read', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { chat: { id: 'chat1' } } } });
    const created = await chatApi.createChat('prod1', 'Hi there');
    expect(created).toEqual({ chat: { id: 'chat1' } });
    expect(mockedApi.post).toHaveBeenCalledWith('/chats', { productId: 'prod1', message: 'Hi there' });

    mockedApi.post.mockResolvedValueOnce({ data: { data: { message: 'ok' } } });
    const response = await chatApi.sendChatMessage('chat1', 'hello');
    expect(response).toEqual({ message: 'ok' });
    expect(mockedApi.post).toHaveBeenCalledWith('/chats/chat1/messages', { message: 'hello' });

    mockedApi.patch.mockResolvedValueOnce({ data: { data: { success: true } } });
    const markRead = await chatApi.markChatRead('chat1');
    expect(markRead).toEqual({ data: { success: true } });
    expect(mockedApi.patch).toHaveBeenCalledWith('/chats/chat1/read');
  });
});
