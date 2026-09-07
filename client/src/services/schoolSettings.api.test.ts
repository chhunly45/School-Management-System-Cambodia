import api from './api';
import {
  createSchoolSettings,
  deleteSchoolSettings,
  getSchoolSettings,
  updateSchoolSettings
} from './schoolSettings.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('schoolSettings.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets, creates, updates, and deletes school settings', async () => {
    const payload = { schoolName: 'SMS-CAM' } as any;
    mockedApi.get.mockResolvedValueOnce({ data: { schoolName: 'SMS-CAM' } } as any);
    mockedApi.post.mockResolvedValueOnce({ data: { created: true } } as any);
    mockedApi.put.mockResolvedValueOnce({ data: { updated: true } } as any);
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } } as any);

    await getSchoolSettings();
    await createSchoolSettings(payload);
    await updateSchoolSettings(payload);
    await deleteSchoolSettings();

    expect(mockedApi.get).toHaveBeenCalledWith('/school-settings');
    expect(mockedApi.post).toHaveBeenCalledWith('/school-settings', payload);
    expect(mockedApi.put).toHaveBeenCalledWith('/school-settings', payload);
    expect(mockedApi.delete).toHaveBeenCalledWith('/school-settings');
  });
});
