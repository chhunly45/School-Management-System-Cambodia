import api from './api';

export const listChats = async () => {
  const response = await api.get('/chats');
  return response.data.data;
};

export const getChat = async (chatId: string) => {
  const response = await api.get(`/chats/${chatId}`);
  return response.data.data;
};

export const createChat = async (productId: string, message?: string) => {
  const response = await api.post('/chats', { productId, message });
  return response.data.data;
};

export const sendChatMessage = async (chatId: string, message: string) => {
  const response = await api.post(`/chats/${chatId}/messages`, { message });
  return response.data.data;
};

export const markChatRead = async (chatId: string) => {
  const response = await api.patch(`/chats/${chatId}/read`);
  return response.data;
};
