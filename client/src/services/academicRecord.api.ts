import api from './api';

export const listAcademicRecords = (query: {
  search?: string;
  className?: string;
  subject?: string;
  examType?: string;
  academicYear?: string;
  semester?: number;
  page?: number;
  perPage?: number;
} = {}) => api.get('/academic-records', { params: query }).then((r) => r.data);

export const getAcademicRecord = (id: string) => api.get(`/academic-records/${id}`).then((r) => r.data);

export const createAcademicRecord = (payload: any) => api.post('/academic-records', payload).then((r) => r.data);

export const updateAcademicRecord = (id: string, payload: any) => api.put(`/academic-records/${id}`, payload).then((r) => r.data);

export const deleteAcademicRecord = (id: string) => api.delete(`/academic-records/${id}`).then((r) => r.data);
