import api from './api';
import type { AttendanceSessionType } from './teacherAttendance.api';

export type AttendanceQrTokenStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface AttendanceQrTokenView {
  id: string;
  token: string;
  sessionType: AttendanceSessionType | null;
  rotationNumber: number;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  createdBy: string | null;
  status: AttendanceQrTokenStatus;
  qrPayloadFormat: 'json-token-v1' | 'json-token-session-v1';
  qrPayload: string;
}

export interface AttendanceQrAdminState {
  current: AttendanceQrTokenView | null;
  recent: AttendanceQrTokenView[];
  policy: {
    defaultExpiresInSeconds: number;
  };
}

export const getAttendanceQrState = (sessionType?: AttendanceSessionType) =>
  api.get('/admin/attendance/qr', { params: sessionType ? { sessionType } : undefined }).then((response) => response.data);

export const generateAttendanceQrToken = (payload: { expiresInSeconds?: number; sessionType?: AttendanceSessionType } = {}) =>
  api.post('/admin/attendance/qr/generate', payload).then((response) => response.data);

export const rotateAttendanceQrToken = (payload: { expiresInSeconds?: number; sessionType?: AttendanceSessionType } = {}) =>
  api.post('/admin/attendance/qr/rotate', payload).then((response) => response.data);

export const revokeAttendanceQrToken = (sessionType?: AttendanceSessionType) =>
  api.post('/admin/attendance/qr/revoke', sessionType ? { sessionType } : {}).then((response) => response.data);