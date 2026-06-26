import api from './api';

export interface Grade {
  _id: string;
  code: string;
  name: string;
  level: number;
  status: 'active' | 'inactive' | 'archived';
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradePayload {
  code: string;
  name: string;
  level: number;
  status: 'active' | 'inactive' | 'archived';
  remarks?: string;
}

export interface GradeListQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'archived';
  level?: number;
  page?: number;
  perPage?: number;
}

export interface GradeListData {
  items: Grade[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const listGrades = (query: GradeListQuery = {}) =>
  api.get<ApiResponse<GradeListData>>('/grades', { params: query }).then((r) => r.data);

export const getGrade = (id: string) => api.get<ApiResponse<Grade>>(`/grades/${id}`).then((r) => r.data);

export const createGrade = (payload: GradePayload) => api.post<ApiResponse<Grade>>('/grades', payload).then((r) => r.data);

export const updateGrade = (id: string, payload: GradePayload) =>
  api.put<ApiResponse<Grade>>(`/grades/${id}`, payload).then((r) => r.data);

export const deleteGrade = (id: string) => api.delete<ApiResponse<null>>(`/grades/${id}`).then((r) => r.data);
