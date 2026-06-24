import api from './api';

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data.data;
};

export const getFavoriteIds = async () => {
  const favorites = await api.get('/favorites');
  return (favorites.data.data || []).map((product: any) => product._id);
};

export const getFavoritesCount = async () => {
  const response = await api.get('/favorites/count');
  return response.data.data.count;
};

export const checkFavorite = async (productId: string) => {
  const response = await api.get(`/favorites/check/${productId}`);
  return response.data.data.isFavorite;
};

export const addFavorite = async (productId: string) => {
  const response = await api.post(`/favorites/${productId}`);
  return response.data.data;
};

export const removeFavorite = async (productId: string) => {
  const response = await api.delete(`/favorites/${productId}`);
  return response.data.data;
};
