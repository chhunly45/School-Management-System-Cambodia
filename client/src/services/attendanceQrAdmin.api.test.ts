import api from './api';
import {
  generateAttendanceQrToken,
  getAttendanceQrState,
  revokeAttendanceQrToken,
  rotateAttendanceQrToken
} from './attendanceQrAdmin.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('attendanceQrAdmin.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets QR state with the selected session', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { current: null } } as any);

    await getAttendanceQrState('afternoon');

    expect(mockedApi.get).toHaveBeenCalledWith('/admin/attendance/qr', {
      params: { sessionType: 'afternoon' }
    });
  });

  it('generates, rotates, and revokes a session QR token', async () => {
    mockedApi.post.mockResolvedValue({ data: { ok: true } } as any);

    await generateAttendanceQrToken({ expiresInSeconds: 300, sessionType: 'morning' });
    await rotateAttendanceQrToken({ sessionType: 'evening' });
    await revokeAttendanceQrToken('evening');

    expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/admin/attendance/qr/generate', {
      expiresInSeconds: 300,
      sessionType: 'morning'
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/admin/attendance/qr/rotate', {
      sessionType: 'evening'
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(3, '/admin/attendance/qr/revoke', {
      sessionType: 'evening'
    });
  });
});
