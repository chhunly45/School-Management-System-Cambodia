import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentsPage from '../pages/PaymentsPage';
import { useAuth } from '../hooks/useAuth';
import { createPayment, getMonthlyPaymentSummary, listPayments } from '../services/payment.api';
import { listAcademicYears } from '../services/academicYear.api';
import { listClasses } from '../services/class.api';
import { listGrades } from '../services/grade.api';
import { listStudents } from '../services/student.api';
import { getSchoolSettings } from '../services/schoolSettings.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/payment.api', () => ({
  listPayments: jest.fn(),
  createPayment: jest.fn(),
  updatePayment: jest.fn(),
  deletePayment: jest.fn(),
  getMonthlyPaymentSummary: jest.fn()
}));

jest.mock('../services/student.api', () => ({
  listStudents: jest.fn()
}));

jest.mock('../services/academicYear.api', () => ({
  listAcademicYears: jest.fn()
}));

jest.mock('../services/grade.api', () => ({
  listGrades: jest.fn()
}));

jest.mock('../services/class.api', () => ({
  listClasses: jest.fn()
}));

jest.mock('../services/schoolSettings.api', () => ({
  getSchoolSettings: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('PaymentsPage success dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });

    (listPayments as jest.Mock).mockResolvedValue({
      data: { items: [], meta: { page: 1, limit: 100, total: 0 } }
    });
    (createPayment as jest.Mock).mockResolvedValue({ receiptNumber: 'RCPT-1001' });
    (getMonthlyPaymentSummary as jest.Mock).mockResolvedValue({ data: { totals: {} } });
    (listAcademicYears as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listGrades as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listClasses as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listStudents as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (getSchoolSettings as jest.Mock).mockResolvedValue({ data: null });
  });

  it('shows a success dialog with actions after creating a payment', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Payment Entry/i)).toBeInTheDocument());

    expect(screen.getByRole('heading', { name: /Receive Payment/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Student ID/i), { target: { value: 'S001' } });
    fireEvent.change(screen.getByLabelText(/Payment Date/i), { target: { value: '2025-01-15' } });
    fireEvent.change(screen.getByLabelText(/Paid Amount/i), { target: { value: '100' } });

    fireEvent.click(screen.getByRole('button', { name: /Create Payment/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Payment created successfully/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Print Receipt/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Download PDF/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /New Payment/i }).length).toBeGreaterThan(0);
  });

  it('renders the payment history overview cards and export actions', async () => {
    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: /^Payment History$/i })).toBeInTheDocument());

    expect(screen.getAllByText(/Today's Collection/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Today's Transactions/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Outstanding Balance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Overdue Students/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Excel/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Download PDF/i }).length).toBeGreaterThan(0);
  });

  it('allows limited users to view, create, and open payment details without edit, delete, or monthly summary', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'LIMITED_STUDENT_PAYMENT' } });
    (listPayments as jest.Mock).mockResolvedValue({
      data: {
        items: [{
          _id: 'payment-1',
          receiptNumber: 'RCPT-LIMITED-1',
          studentId: 'S-LIMITED-1',
          studentName: 'Limited Student',
          className: 'Room 1',
          paymentType: 'monthly',
          paymentPlan: 'monthly',
          tuitionAmount: 100,
          amount: 100,
          discount: 0,
          remainingBalance: 0,
          paymentDate: '2026-09-30',
          paymentMethod: 'cash',
          academicYear: '2026-2027',
          semester: 1,
          status: 'paid',
          remarks: '',
          feeEntries: []
        }],
        meta: { page: 1, limit: 100, total: 1 }
      }
    });
    (listStudents as jest.Mock).mockResolvedValue({
      data: { items: [{ _id: 'student-1', studentId: 'S-LIMITED-1', fullName: 'Limited Student', className: 'Room 1', monthlyTuition: 100 }] }
    });

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('RCPT-LIMITED-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Payment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Receipt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByText('Monthly Summary')).not.toBeInTheDocument();

    expect(getMonthlyPaymentSummary).not.toHaveBeenCalled();
    expect(listAcademicYears).not.toHaveBeenCalled();
    expect(listGrades).not.toHaveBeenCalled();
    expect(listClasses).not.toHaveBeenCalled();
    expect(getSchoolSettings).not.toHaveBeenCalled();
  });
});
