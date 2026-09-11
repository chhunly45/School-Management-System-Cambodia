import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminTeacherAttendancePage from './AdminTeacherAttendancePage';
import { getAdminTeacherAttendance } from '../services/teacherAttendanceAdmin.api';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/teacherAttendanceAdmin.api', () => ({
  getAdminTeacherAttendance: jest.fn()
}));

jest.mock('../components/attendance/AttendanceStatusBadge', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span>{status}</span>
}));

const mockedGetAdminTeacherAttendance = getAdminTeacherAttendance as jest.MockedFunction<typeof getAdminTeacherAttendance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const response = {
  data: {
    summary: {
      date: '2026-09-11',
      checkedIn: 0,
      checkedOut: 0,
      byStatus: { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 }
    },
    items: [],
    meta: { page: 1, limit: 100, total: 0 }
  }
};

describe('AdminTeacherAttendancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { role: 'admin' } } as ReturnType<typeof useAuth>);
    mockedGetAdminTeacherAttendance.mockResolvedValue(response);
  });

  it('loads the selected date range while preserving existing filters', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminTeacherAttendancePage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockedGetAdminTeacherAttendance).toHaveBeenCalled());
    expect(screen.getByLabelText('From date')).toBeInTheDocument();
    expect(screen.getByLabelText('To date')).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');

    await user.clear(screen.getByPlaceholderText('Search teacher'));
    await user.type(screen.getByPlaceholderText('Search teacher'), 'Proeung');
    await user.selectOptions(selects[0], 'afternoon');
    await user.selectOptions(selects[1], 'LATE');
    await user.clear(screen.getByLabelText('From date'));
    await user.type(screen.getByLabelText('From date'), '2026-09-01');
    await user.clear(screen.getByLabelText('To date'));
    await user.type(screen.getByLabelText('To date'), '2026-09-11');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(mockedGetAdminTeacherAttendance).toHaveBeenLastCalledWith({
      search: 'Proeung',
      sessionType: 'afternoon',
      status: 'LATE',
      fromDate: '2026-09-01',
      toDate: '2026-09-11',
      perPage: 100
    }));
  });
});
