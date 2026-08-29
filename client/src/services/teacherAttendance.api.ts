import api from './api';

export type AttendanceMethod = 'QR' | 'FACE' | 'MANUAL';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE';
export type AttendanceSessionType = 'morning' | 'afternoon' | 'evening';

export interface TeacherAttendanceRecord {
  _id: string;
  teacherId:
    | string
    | {
        _id: string;
        teacherId: string;
        fullName: string;
        phone?: string;
        email?: string;
      };
  userId: string;
  attendanceDate: string;
  sessionType: AttendanceSessionType | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  attendanceMethod: AttendanceMethod;
  status: AttendanceStatus;
  latitude?: number | null;
  longitude?: number | null;
  gpsAccuracy?: number | null;
  distanceFromSchool?: number | null;
  qrTokenId?: string | null;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckInPayload {
  attendanceMethod?: AttendanceMethod;
  qrToken?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  remarks?: string;
  device?: string;
  sessionType?: AttendanceSessionType;
  qrSessionType?: AttendanceSessionType | null;
}

export interface CheckOutPayload {
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  remarks?: string;
  device?: string;
  sessionType?: AttendanceSessionType;
}

export interface TodayAttendanceState {
  attendance: TeacherAttendanceRecord | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface AttendanceHistoryQuery {
  fromDate?: string;
  toDate?: string;
  status?: AttendanceStatus;
  attendanceMethod?: AttendanceMethod;
  sessionType?: AttendanceSessionType;
  page?: number;
  perPage?: number;
}

export interface AttendanceHistoryResult {
  items: TeacherAttendanceRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const checkInTeacherAttendance = (payload: CheckInPayload) =>
  api.post('/teacher-attendance/check-in', payload).then((response) => response.data);

export const checkOutTeacherAttendance = (payload: CheckOutPayload) =>
  api.post('/teacher-attendance/check-out', payload).then((response) => response.data);

export const getTodayTeacherAttendance = (sessionType?: AttendanceSessionType) =>
  api.get('/teacher-attendance/today', { params: sessionType ? { sessionType } : undefined }).then((response) => response.data);

export const getTeacherAttendanceHistory = (query: AttendanceHistoryQuery = {}) =>
  api.get('/teacher-attendance/history', { params: query }).then((response) => response.data);
