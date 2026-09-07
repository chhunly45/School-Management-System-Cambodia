import api from './api';
import {
  createTeacher,
  createTeacherAccount,
  deleteTeacher,
  getTeacher,
  listTeachers,
  updateTeacher
} from './teacher.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('teacher.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists teachers with query params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [] } } as any);

    await listTeachers({ page: 1, perPage: 100, includeRelations: true });

    expect(mockedApi.get).toHaveBeenCalledWith('/teachers', {
      params: { page: 1, perPage: 100, includeRelations: true }
    });
  });

  it('gets, creates, updates, deletes, and provisions teacher accounts', async () => {
    const payload = {
      teacherId: 'T-001',
      fullName: 'Teacher One',
      gender: 'other' as const,
      qualification: 'Bachelor' as const,
      experienceYears: 0,
      status: 'active' as const
    };
    mockedApi.get.mockResolvedValueOnce({ data: { id: 't1' } } as any);
    mockedApi.post
      .mockResolvedValueOnce({ data: { created: true } } as any)
      .mockResolvedValueOnce({ data: { accountCreated: true } } as any);
    mockedApi.put.mockResolvedValueOnce({ data: { updated: true } } as any);
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } } as any);

    await getTeacher('t1');
    await createTeacher(payload);
    await updateTeacher('t1', payload);
    await deleteTeacher('t1');
    await createTeacherAccount('t1');

    expect(mockedApi.get).toHaveBeenCalledWith('/teachers/t1');
    expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/teachers', payload);
    expect(mockedApi.put).toHaveBeenCalledWith('/teachers/t1', payload);
    expect(mockedApi.delete).toHaveBeenCalledWith('/teachers/t1');
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/teachers/t1/account');
  });
});
