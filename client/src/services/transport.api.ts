import api from './api';

export const listTransport = (query: {
  search?: string;
  status?: 'active' | 'inactive';
  routeName?: string;
  academicYear?: string;
  studentId?: string;
  page?: number;
  perPage?: number;
} = {}) => api.get('/transport', { params: query }).then((r) => r.data);

export const getTransport = (id: string) => api.get(`/transport/${id}`).then((r) => r.data);

export const createTransport = (payload: any) => api.post('/transport', payload).then((r) => r.data);

export const updateTransport = (id: string, payload: any) => api.put(`/transport/${id}`, payload).then((r) => r.data);

export const deleteTransport = (id: string) => api.delete(`/transport/${id}`).then((r) => r.data);
