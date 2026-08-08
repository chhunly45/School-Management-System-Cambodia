import api from './api';
import {
  createEmployeeAttendance,
  deleteEmployeeAttendance,
  getEmployeeAttendance,
  listEmployeeAttendance,
  updateEmployeeAttendance
} from './employeeAttendance.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('employeeAttendance.api', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
  });

  it('lists employee attendance with query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [] } } as any);

    const result = await listEmployeeAttendance({ employeeType: 'Teacher', status: 'present' });

    expect(mockedApi.get).toHaveBeenCalledWith('/employee-attendances', {
      params: { employeeType: 'Teacher', status: 'present' }
    });
    expect(result).toEqual({ items: [] });
  });

  it('gets, creates, updates, and deletes employee attendance records', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { id: 'e1' } } as any);
    mockedApi.post.mockResolvedValueOnce({ data: { created: true } } as any);
    mockedApi.put.mockResolvedValueOnce({ data: { updated: true } } as any);
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } } as any);

    const payload = {
      employeeCode: 'EMP-01',
      employeeName: 'Teacher One',
      date: '2026-08-07',
      status: 'present' as const
    };

    expect(await getEmployeeAttendance('e1')).toEqual({ id: 'e1' });
    expect(mockedApi.get).toHaveBeenCalledWith('/employee-attendances/e1');

    expect(await createEmployeeAttendance(payload)).toEqual({ created: true });
    expect(mockedApi.post).toHaveBeenCalledWith('/employee-attendances', payload);

    expect(await updateEmployeeAttendance('e1', payload)).toEqual({ updated: true });
    expect(mockedApi.put).toHaveBeenCalledWith('/employee-attendances/e1', payload);

    expect(await deleteEmployeeAttendance('e1')).toEqual({ deleted: true });
    expect(mockedApi.delete).toHaveBeenCalledWith('/employee-attendances/e1');
  });
});
