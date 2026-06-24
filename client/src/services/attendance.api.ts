import api from './api';

export const listAttendance = (query: {
  search?: string;
  date?: string;
  className?: string;
  academicYear?: string;
  semester?: number;
  page?: number;
  perPage?: number;
} = {}) => api.get('/attendances', { params: query }).then((r) => r.data);

export const getAttendance = (id: string) => api.get(`/attendances/${id}`).then((r) => r.data);

export const createAttendance = (payload: any) => api.post('/attendances', payload).then((r) => r.data);

export const updateAttendance = (id: string, payload: any) => api.put(`/attendances/${id}`, payload).then((r) => r.data);

export const deleteAttendance = (id: string) => api.delete(`/attendances/${id}`).then((r) => r.data);
