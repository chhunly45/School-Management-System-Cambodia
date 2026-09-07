import api from './api';
import {
  createPayment,
  deletePayment,
  getMonthlyPaymentSummary,
  getPayment,
  listPayments,
  updatePayment
} from './payment.api';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('payment.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists payments with filters and gets a payment with relations', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { items: [] } } as any)
      .mockResolvedValueOnce({ data: { id: 'p1' } } as any);

    await listPayments({ page: 1, perPage: 20, status: 'pending' });
    await getPayment('p1', true);

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/payments', {
      params: { page: 1, perPage: 20, status: 'pending' }
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/payments/p1', {
      params: { includeRelations: true }
    });
  });

  it('creates, updates, deletes, and summarizes payments', async () => {
    const payload = { studentId: 's1', studentName: 'Student One', className: 'G1', amount: 100, paymentDate: '2026-09-06', paymentMethod: 'cash', status: 'paid' } as any;
    mockedApi.post.mockResolvedValueOnce({ data: { created: true } } as any);
    mockedApi.put.mockResolvedValueOnce({ data: { updated: true } } as any);
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } } as any);
    mockedApi.get.mockResolvedValueOnce({ data: { totals: {} } } as any);

    await createPayment(payload);
    await updatePayment('p1', payload);
    await deletePayment('p1');
    await getMonthlyPaymentSummary({ year: 2026, month: 9 });

    expect(mockedApi.post).toHaveBeenCalledWith('/payments', payload);
    expect(mockedApi.put).toHaveBeenCalledWith('/payments/p1', payload);
    expect(mockedApi.delete).toHaveBeenCalledWith('/payments/p1');
    expect(mockedApi.get).toHaveBeenCalledWith('/payments/summary/monthly', {
      params: { year: 2026, month: 9 }
    });
  });
});
