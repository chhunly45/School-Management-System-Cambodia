import api from './api';

export interface StudentListQuery {
  search?: string;
  status?: string;
  className?: string;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  page?: number;
  perPage?: number;
}

export interface StudentListData {
  items: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const listStudents = (query: StudentListQuery = {}) =>
  api.get<ApiResponse<StudentListData>>('/students', { params: query }).then((r) => r.data);

export const getStudent = (id: string) => api.get(`/students/${id}`).then((r) => r.data);
export const createStudent = (payload: any) => api.post('/students', payload).then((r) => r.data);
export const updateStudent = (id: string, payload: any) => api.put(`/students/${id}`, payload).then((r) => r.data);
export const deleteStudent = (id: string) => api.delete(`/students/${id}`).then((r) => r.data);
