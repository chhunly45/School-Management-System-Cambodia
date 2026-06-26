import api from './api';

export interface AcademicYear {
  _id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'closed' | 'archived';
  isCurrent: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicYearPayload {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'closed' | 'archived';
  isCurrent: boolean;
  remarks?: string;
}

export interface AcademicYearListQuery {
  search?: string;
  status?: 'planned' | 'active' | 'closed' | 'archived';
  isCurrent?: boolean;
  page?: number;
  perPage?: number;
}

export interface AcademicYearListData {
  items: AcademicYear[];
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

export const listAcademicYears = (query: AcademicYearListQuery = {}) =>
  api.get<ApiResponse<AcademicYearListData>>('/academic-years', { params: query }).then((r) => r.data);

export const getAcademicYear = (id: string) => api.get<ApiResponse<AcademicYear>>(`/academic-years/${id}`).then((r) => r.data);

export const createAcademicYear = (payload: AcademicYearPayload) =>
  api.post<ApiResponse<AcademicYear>>('/academic-years', payload).then((r) => r.data);

export const updateAcademicYear = (id: string, payload: AcademicYearPayload) =>
  api.put<ApiResponse<AcademicYear>>(`/academic-years/${id}`, payload).then((r) => r.data);

export const deleteAcademicYear = (id: string) => api.delete<ApiResponse<null>>(`/academic-years/${id}`).then((r) => r.data);
