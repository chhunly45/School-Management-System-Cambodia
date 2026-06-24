import api from './api';

export const getActiveBanners = (position = 'top') => api.get(`/banners/active?position=${position}`).then((r) => r.data);

export const listBanners = () => api.get('/banners').then((r) => r.data);
export const createBanner = (payload: any) => api.post('/banners', payload).then((r) => r.data);
export const updateBanner = (id: string, payload: any) => api.patch(`/banners/${id}`, payload).then((r) => r.data);
export const deleteBanner = (id: string) => api.delete(`/banners/${id}`).then((r) => r.data);
