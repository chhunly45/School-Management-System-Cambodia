import api from './api';

export const listTeachers = (query: { search?: string; status?: string; className?: string; page?: number; perPage?: number } = {}) =>
  api.get('/teachers', { params: query }).then((r) => r.data);

export const getTeacher = (id: string) => api.get(`/teachers/${id}`).then((r) => r.data);
export const createTeacher = (payload: any) => api.post('/teachers', payload).then((r) => r.data);
export const updateTeacher = (id: string, payload: any) => api.put(`/teachers/${id}`, payload).then((r) => r.data);
export const deleteTeacher = (id: string) => api.delete(`/teachers/${id}`).then((r) => r.data);
