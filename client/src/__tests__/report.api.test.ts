import api from '../services/api';
import * as reportApi from '../services/report.api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('report.api', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('creates product report successfully', async () => {
      const payload = {
        targetType: 'product' as const,
        targetId: 'prod123',
        reason: 'fake_product' as const,
        details: 'Not as described'
      };
      const reportData = { _id: 'report1', ...payload, createdAt: '2024-01-01' };
      mockedApi.post.mockResolvedValueOnce({ data: { data: reportData } } as any);

      const result = await reportApi.createReport(payload);

      expect(result).toEqual(reportData);
      expect(mockedApi.post).toHaveBeenCalledWith('/reports', payload);
    });

    it('creates user report successfully', async () => {
      const payload = {
        targetType: 'user' as const,
        targetId: 'user123',
        reason: 'scam' as const,
        details: 'Suspicious behavior'
      };
      const reportData = { _id: 'report2', ...payload, createdAt: '2024-01-01' };
      mockedApi.post.mockResolvedValueOnce({ data: { data: reportData } } as any);

      const result = await reportApi.createReport(payload);

      expect(result).toEqual(reportData);
      expect(mockedApi.post).toHaveBeenCalledWith('/reports', payload);
    });

    it('handles different report reasons', async () => {
      const reasons: Array<'scam' | 'fake_product' | 'duplicate_listing' | 'wrong_category' | 'other'> = [
        'duplicate_listing',
        'wrong_category',
        'other'
      ];

      for (const reason of reasons) {
        mockedApi.post.mockResolvedValueOnce({ data: { data: { _id: `r_${reason}`, reason } } } as any);
        const payload = { targetType: 'product' as const, targetId: 'id', reason };
        await reportApi.createReport(payload);
        expect(mockedApi.post).toHaveBeenCalledWith('/reports', expect.objectContaining({ reason }));
      }
    });

    it('propagates API error on report creation failure', async () => {
      const payload = { targetType: 'product' as const, targetId: 'id', reason: 'scam' as const };
      const error = new Error('Server error');
      mockedApi.post.mockRejectedValueOnce(error);

      await expect(reportApi.createReport(payload)).rejects.toThrow('Server error');
      expect(mockedApi.post).toHaveBeenCalledWith('/reports', payload);
    });

    it('includes optional details in report', async () => {
      const payload = {
        targetType: 'product' as const,
        targetId: 'prod1',
        reason: 'other' as const,
        details: 'Custom reason text'
      };
      mockedApi.post.mockResolvedValueOnce({ data: { data: { _id: 'r1', ...payload } } } as any);

      const result = await reportApi.createReport(payload);

      expect(result.details).toBe('Custom reason text');
      expect(mockedApi.post).toHaveBeenCalledWith('/reports', expect.objectContaining({ details: 'Custom reason text' }));
    });

    it('handles report without optional details', async () => {
      const payload = {
        targetType: 'product' as const,
        targetId: 'prod2',
        reason: 'scam' as const
      };
      mockedApi.post.mockResolvedValueOnce({ data: { data: { _id: 'r2', ...payload } } } as any);

      await reportApi.createReport(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/reports', payload);
    });
  });

  describe('getMyReports', () => {
    it('retrieves user reports successfully', async () => {
      const reports = [
        { _id: 'r1', targetType: 'product', targetId: 'p1', reason: 'scam' },
        { _id: 'r2', targetType: 'user', targetId: 'u1', reason: 'fake_product' }
      ];
      mockedApi.get.mockResolvedValueOnce({ data: { data: reports } } as any);

      const result = await reportApi.getMyReports();

      expect(result).toEqual(reports);
      expect(mockedApi.get).toHaveBeenCalledWith('/reports/me');
    });

    it('returns empty array when no reports exist', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { data: [] } } as any);

      const result = await reportApi.getMyReports();

      expect(result).toEqual([]);
      expect(mockedApi.get).toHaveBeenCalledWith('/reports/me');
    });

    it('propagates API error when fetching reports fails', async () => {
      const error = new Error('Unauthorized');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(reportApi.getMyReports()).rejects.toThrow('Unauthorized');
      expect(mockedApi.get).toHaveBeenCalledWith('/reports/me');
    });

    it('handles network errors', async () => {
      const error = new Error('Network timeout');
      mockedApi.get.mockRejectedValueOnce(error);

      await expect(reportApi.getMyReports()).rejects.toThrow('Network timeout');
    });
  });
});
