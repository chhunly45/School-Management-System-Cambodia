import api from './api';

export interface AttendanceListQuery {
  search?: string;
  date?: string;
  className?: string;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  academicYear?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
  includeRelations?: boolean;
  semester?: number;
  page?: number;
  perPage?: number;
}

export interface AttendancePayload {
  studentId: string;
  studentName: string;
  className: string;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  academicYear?: string;
  semester?: 1 | 2;
}

export interface MonthlyAttendanceReportQuery {
  year?: number;
  month?: number;
  academicYearId?: string;
  gradeId?: string;
  classId?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
}

export const listAttendance = (query: AttendanceListQuery = {}) => api.get('/attendances', { params: query }).then((r) => r.data);

export const getAttendance = (id: string) => api.get(`/attendances/${id}`).then((r) => r.data);

export const createAttendance = (payload: AttendancePayload) => api.post('/attendances', payload).then((r) => r.data);

export const updateAttendance = (id: string, payload: AttendancePayload) => api.put(`/attendances/${id}`, payload).then((r) => r.data);

export const deleteAttendance = (id: string) => api.delete(`/attendances/${id}`).then((r) => r.data);

export const getMonthlyAttendanceReport = (query: MonthlyAttendanceReportQuery = {}) =>
  api.get('/attendances/reports/monthly', { params: query }).then((r) => r.data);
