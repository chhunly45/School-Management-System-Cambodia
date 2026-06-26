import api from './api';

type SubjectRef = string | { _id: string; code: string; name: string };
type ClassRef = string | { _id: string; className: string };

export interface Teacher {
  _id: string;
  teacherId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  qualification: 'Bachelor' | 'Master' | 'PhD' | 'Other';
  specialization?: string;
  experienceYears: number;
  className?: string;
  subjects?: string[];
  subjectIds?: SubjectRef[];
  homeroomClassId?: ClassRef;
  status: 'active' | 'inactive';
  joinDate?: string;
  remarks?: string;
}

export interface TeacherListQuery {
  search?: string;
  status?: string;
  className?: string;
  subjectId?: string;
  homeroomClassId?: string;
  includeRelations?: boolean;
  page?: number;
  perPage?: number;
}

export interface TeacherListData {
  items: Teacher[];
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

export type TeacherPayload = Omit<Teacher, '_id'>;

export const listTeachers = (query: TeacherListQuery = {}) =>
  api.get<ApiResponse<TeacherListData>>('/teachers', { params: query }).then((r) => r.data);

export const getTeacher = (id: string) => api.get<ApiResponse<Teacher>>(`/teachers/${id}`).then((r) => r.data);
export const createTeacher = (payload: TeacherPayload) => api.post<ApiResponse<Teacher>>('/teachers', payload).then((r) => r.data);
export const updateTeacher = (id: string, payload: TeacherPayload) => api.put<ApiResponse<Teacher>>(`/teachers/${id}`, payload).then((r) => r.data);
export const deleteTeacher = (id: string) => api.delete<ApiResponse<null>>(`/teachers/${id}`).then((r) => r.data);
