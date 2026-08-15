import api from './api';

export type AttendanceQrTokenStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface AttendanceQrTokenView {
  id: string;
  token: string;
  rotationNumber: number;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  createdBy: string | null;
  status: AttendanceQrTokenStatus;
  qrPayloadFormat: 'json-token-v1';
  qrPayload: string;
}

export interface AttendanceQrAdminState {
  current: AttendanceQrTokenView | null;
  recent: AttendanceQrTokenView[];
  policy: {
    defaultExpiresInSeconds: number;
  };
}

export const getAttendanceQrState = () =>
  api.get('/admin/attendance/qr').then((response) => response.data);

export const generateAttendanceQrToken = (payload: { expiresInSeconds?: number } = {}) =>
  api.post('/admin/attendance/qr/generate', payload).then((response) => response.data);

export const rotateAttendanceQrToken = (payload: { expiresInSeconds?: number } = {}) =>
  api.post('/admin/attendance/qr/rotate', payload).then((response) => response.data);

export const revokeAttendanceQrToken = () =>
  api.post('/admin/attendance/qr/revoke').then((response) => response.data);