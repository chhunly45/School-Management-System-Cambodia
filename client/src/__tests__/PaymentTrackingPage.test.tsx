import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentTrackingPage from '../pages/PaymentTrackingPage';
import { useAuth } from '../hooks/useAuth';
import { getPaymentTrackingReport } from '../services/finance.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/finance.api', () => ({
  getPaymentTrackingReport: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('PaymentTrackingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
    (getPaymentTrackingReport as jest.Mock).mockResolvedValue({
      data: {
        items: [{
          rowNumber: 1,
          studentId: 'S-001',
          fullName: 'Alice / សាលី',
          englishName: 'Alice',
          khmerName: 'សាលី',
          route: 'Route A',
          vehicle: 'ABC-123',
          monthlyRouteFee: 25,
          transportCharge: 25,
          gender: 'female',
          phone: '012345678',
          paymentStartDate: '2025-01-01',
          paymentDurationMonths: 1,
          dueDate: '2025-01-10',
          tuitionAmount: 100,
          discount: 0,
          totalAmount: 100,
          daysLeft: 5,
          status: 'Warning',
          room: 'Room 1',
          session: 'Morning',
          className: 'Grade 1',
          paymentPlan: 'monthly'
        }],
        meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
        summary: { totalStudents: 1, paid: 0, warning: 1, expired: 0, sessions: { Morning: 1 }, rooms: { 'Room 1': 1 }, totalTuition: 100, totalDiscount: 0, totalPaid: 100 }
      }
    });
  });

  it('renders tracking summary and table rows', async () => {
    render(
      <MemoryRouter>
        <PaymentTrackingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: /Payment Tracking/i })).toBeInTheDocument());
    expect(screen.getByText(/Total Students/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Warning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/S-001/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Morning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('សាលី').length).toBeGreaterThan(1);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Alice / សាលី')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Route A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ABC-123/i).length).toBeGreaterThan(0);
  });
});
