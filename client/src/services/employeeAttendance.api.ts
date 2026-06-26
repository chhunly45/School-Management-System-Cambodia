import api from './api';

export interface EmployeeAttendanceListQuery {
  search?: string;
  date?: string;
  employeeType?: string;
  status?: 'present' | 'late' | 'leave' | 'absent';
  page?: number;
  perPage?: number;
}

export interface EmployeeAttendancePayload {
  employeeCode: string;
  employeeName: string;
  employeeType?: string;
  department?: string;
  scheduleLabel?: string;
  workStartTime?: string;
  workEndTime?: string;
  date: string;
  status: 'present' | 'late' | 'leave' | 'absent';
  remarks?: string;
}

export const listEmployeeAttendance = (query: EmployeeAttendanceListQuery = {}) =>
  api.get('/employee-attendances', { params: query }).then((r) => r.data);

export const getEmployeeAttendance = (id: string) => api.get(`/employee-attendances/${id}`).then((r) => r.data);

export const createEmployeeAttendance = (payload: EmployeeAttendancePayload) =>
  api.post('/employee-attendances', payload).then((r) => r.data);

export const updateEmployeeAttendance = (id: string, payload: EmployeeAttendancePayload) =>
  api.put(`/employee-attendances/${id}`, payload).then((r) => r.data);

export const deleteEmployeeAttendance = (id: string) => api.delete(`/employee-attendances/${id}`).then((r) => r.data);