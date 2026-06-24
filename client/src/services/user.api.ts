import api from './api';

export const getUserProfile = async (userId: string) => {
  const response = await api.get(`/users/profile/${userId}`);
  return response.data.data;
};

export const updateUserProfile = async (payload: Record<string, any>) => {
  const response = await api.put('/users/profile', payload);
  return response.data.data;
};
