import api from './api';
import type { AttendanceSessionType, AttendanceStatus, TeacherAttendanceRecord } from './teacherAttendance.api';

export interface AdminTeacherAttendanceResponse {
  summary: {
    date: string;
    checkedIn: number;
    checkedOut: number;
    byStatus: Record<AttendanceStatus, number>;
  };
  items: TeacherAttendanceRecord[];
  meta: { page: number; limit: number; total: number };
}

export const getAdminTeacherAttendance = (query: {
  date?: string;
  search?: string;
  status?: AttendanceStatus;
  sessionType?: AttendanceSessionType;
  page?: number;
  perPage?: number;
} = {}) => api.get('/admin/teacher-attendance/today', { params: query }).then((response) => response.data);
