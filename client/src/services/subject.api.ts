import api from './api';

export interface Subject {
  _id: string;
  code: string;
  name: string;
  description?: string;
  credit: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectPayload {
  code: string;
  name: string;
  description?: string;
  credit: number;
  status: 'active' | 'inactive';
}

export interface SubjectListQuery {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  perPage?: number;
}

export interface SubjectListData {
  items: Subject[];
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

export const listSubjects = (query: SubjectListQuery = {}) =>
  api.get<ApiResponse<SubjectListData>>('/subjects', { params: query }).then((r) => r.data);

export const getSubject = (id: string) => api.get<ApiResponse<Subject>>(`/subjects/${id}`).then((r) => r.data);

export const createSubject = (payload: SubjectPayload) =>
  api.post<ApiResponse<Subject>>('/subjects', payload).then((r) => r.data);

export const updateSubject = (id: string, payload: SubjectPayload) =>
  api.put<ApiResponse<Subject>>(`/subjects/${id}`, payload).then((r) => r.data);

export const deleteSubject = (id: string) => api.delete<ApiResponse<null>>(`/subjects/${id}`).then((r) => r.data);