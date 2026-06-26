import api from './api';

export interface ClassItem {
  _id: string;
  className: string;
  academicYearId: string | { _id: string; code: string; name: string };
  gradeId: string | { _id: string; code: string; name: string; level: number };
  capacity: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassPayload {
  className: string;
  academicYearId: string;
  gradeId: string;
  capacity: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
}

export interface ClassListQuery {
  search?: string;
  status?: 'active' | 'inactive' | 'archived';
  academicYearId?: string;
  gradeId?: string;
  page?: number;
  perPage?: number;
}

export interface ClassListData {
  items: ClassItem[];
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

export const listClasses = (query: ClassListQuery = {}) =>
  api.get<ApiResponse<ClassListData>>('/classes', { params: query }).then((r) => r.data);

export const getClassById = (id: string) => api.get<ApiResponse<ClassItem>>(`/classes/${id}`).then((r) => r.data);

export const createClass = (payload: ClassPayload) => api.post<ApiResponse<ClassItem>>('/classes', payload).then((r) => r.data);

export const updateClass = (id: string, payload: ClassPayload) =>
  api.put<ApiResponse<ClassItem>>(`/classes/${id}`, payload).then((r) => r.data);

export const deleteClass = (id: string) => api.delete<ApiResponse<null>>(`/classes/${id}`).then((r) => r.data);
