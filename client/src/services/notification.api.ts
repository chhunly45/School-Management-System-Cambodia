import api from './api';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  const data = response.data.data;
  
  // Handle both array and object response shapes
  // Backend returns { items: [], meta: {...} }
  // But also support direct array for backward compatibility
  const notificationItems = Array.isArray(data)
    ? data
    : data?.items || [];
  
  return notificationItems;
};

export const getNotificationsCount = async () => {
  const response = await api.get('/notifications/count');
  return response.data.data?.count || 0;
};

export const markNotificationRead = async (notificationId: string) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data.data;
};
