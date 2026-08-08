import api from './api';
import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  getMonthlyAttendanceReport,
  listAttendance,
  updateAttendance
} from './attendance.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('attendance.api', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
  });

  it('lists attendance with query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [] } } as any);

    const result = await listAttendance({ page: 1, perPage: 20, status: 'present' });

    expect(mockedApi.get).toHaveBeenCalledWith('/attendances', {
      params: { page: 1, perPage: 20, status: 'present' }
    });
    expect(result).toEqual({ items: [] });
  });

  it('gets, creates, updates, and deletes attendance records', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { id: 'a1' } } as any);
    mockedApi.post.mockResolvedValueOnce({ data: { created: true } } as any);
    mockedApi.put.mockResolvedValueOnce({ data: { updated: true } } as any);
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } } as any);

    const payload = {
      studentId: 's1',
      studentName: 'Student One',
      className: 'G1-A',
      date: '2026-08-07',
      status: 'present' as const
    };

    expect(await getAttendance('a1')).toEqual({ id: 'a1' });
    expect(mockedApi.get).toHaveBeenCalledWith('/attendances/a1');

    expect(await createAttendance(payload)).toEqual({ created: true });
    expect(mockedApi.post).toHaveBeenCalledWith('/attendances', payload);

    expect(await updateAttendance('a1', payload)).toEqual({ updated: true });
    expect(mockedApi.put).toHaveBeenCalledWith('/attendances/a1', payload);

    expect(await deleteAttendance('a1')).toEqual({ deleted: true });
    expect(mockedApi.delete).toHaveBeenCalledWith('/attendances/a1');
  });

  it('gets monthly attendance report', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { report: [] } } as any);

    const result = await getMonthlyAttendanceReport({ year: 2026, month: 8, status: 'late' });

    expect(mockedApi.get).toHaveBeenCalledWith('/attendances/reports/monthly', {
      params: { year: 2026, month: 8, status: 'late' }
    });
    expect(result).toEqual({ report: [] });
  });
});
