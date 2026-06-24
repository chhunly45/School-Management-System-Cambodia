import api from './api';

export const listPayments = (query: { 
  search?: string; 
  status?: string; 
  paymentMethod?: string; 
  academicYear?: string;
  semester?: number;
  page?: number; 
  perPage?: number 
} = {}) =>
  api.get('/payments', { params: query }).then((r) => r.data);

export const getPayment = (id: string) => api.get(`/payments/${id}`).then((r) => r.data);

export const createPayment = (payload: any) => api.post('/payments', payload).then((r) => r.data);

export const updatePayment = (id: string, payload: any) => api.put(`/payments/${id}`, payload).then((r) => r.data);

export const deletePayment = (id: string) => api.delete(`/payments/${id}`).then((r) => r.data);
