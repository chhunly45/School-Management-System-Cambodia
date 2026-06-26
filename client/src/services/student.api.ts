import api from './api';

export const listStudents = (
  query: {
    search?: string;
    status?: string;
    className?: string;
    academicYearId?: string;
    gradeId?: string;
    classId?: string;
    page?: number;
    perPage?: number;
  } = {}
) =>
  api.get('/students', { params: query }).then((r) => r.data);

export const getStudent = (id: string) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (payload: any) => api.post('/students', payload).then((r) => r.data);
export const updateStudent = (id: string, payload: any) => api.put(`/students/${id}`, payload).then((r) => r.data);
export const deleteStudent = (id: string) => api.delete(`/students/${id}`).then((r) => r.data);
