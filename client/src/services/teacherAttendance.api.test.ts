import api from './api';
import {
  checkInTeacherAttendance,
  checkOutTeacherAttendance,
  getTeacherAttendanceHistory,
  getTodayTeacherAttendance
} from './teacherAttendance.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('teacherAttendance.api', () => {
  beforeEach(() => {
    mockedApi.post.mockReset();
    mockedApi.get.mockReset();
  });

  it('posts check-in payload and returns data', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { ok: true } } as any);

    const result = await checkInTeacherAttendance({ attendanceMethod: 'QR', qrToken: 'token-1' });

    expect(mockedApi.post).toHaveBeenCalledWith('/teacher-attendance/check-in', {
      attendanceMethod: 'QR',
      qrToken: 'token-1'
    });
    expect(result).toEqual({ ok: true });
  });

  it('posts check-out payload and returns data', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { status: 'checked-out' } } as any);

    const result = await checkOutTeacherAttendance({ remarks: 'done' });

    expect(mockedApi.post).toHaveBeenCalledWith('/teacher-attendance/check-out', { remarks: 'done' });
    expect(result).toEqual({ status: 'checked-out' });
  });

  it('gets today attendance', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { attendance: null } } as any);

    const result = await getTodayTeacherAttendance();

    expect(mockedApi.get).toHaveBeenCalledWith('/teacher-attendance/today', { params: undefined });
    expect(result).toEqual({ attendance: null });
  });

  it('gets history with query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [] } } as any);

    const result = await getTeacherAttendanceHistory({ page: 2, perPage: 10, status: 'PRESENT' });

    expect(mockedApi.get).toHaveBeenCalledWith('/teacher-attendance/history', {
      params: { page: 2, perPage: 10, status: 'PRESENT' }
    });
    expect(result).toEqual({ items: [] });
  });
});
