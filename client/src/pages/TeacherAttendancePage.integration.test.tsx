import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeacherAttendancePage from './TeacherAttendancePage';

const getTodayTeacherAttendanceMock = jest.fn();
const getTeacherAttendanceHistoryMock = jest.fn();
const mockAuthUser = {
  id: 'u-teacher-1',
  email: 'teacher@example.com',
  role: 'teacher'
};

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser
  })
}));

jest.mock('../services/teacherAttendance.api', () => ({
  checkInTeacherAttendance: jest.fn(),
  checkOutTeacherAttendance: jest.fn(),
  getTodayTeacherAttendance: (sessionType: string) => getTodayTeacherAttendanceMock(sessionType),
  getTeacherAttendanceHistory: () => getTeacherAttendanceHistoryMock()
}));

jest.mock('lucide-react', () => ({
  QrCode: () => <svg aria-label="qr-icon" />,
  LocateFixed: () => <svg aria-label="locate-icon" />
}));

jest.mock('../components/attendance/AttendanceActionCard', () => ({
  __esModule: true,
  default: ({ title, actionLabel, onAction, children }: any) => (
    <section>
      <h3>{title}</h3>
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
      <div>{children}</div>
    </section>
  )
}));

jest.mock('../components/attendance/AttendanceHistoryList', () => ({
  __esModule: true,
  default: ({ items }: any) => <div>history-items:{items?.length ?? 0}</div>
}));

jest.mock('../components/attendance/AttendanceStatusBadge', () => ({
  __esModule: true,
  default: ({ status }: any) => <span>StatusBadge:{status}</span>
}));

jest.mock('../components/attendance/QrScannerPanel', () => ({
  __esModule: true,
  default: ({ onDecodedToken }: any) => (
    <>
      <p>Camera permission denied. Enable camera access and try again.</p>
      <button type="button" onClick={() => onDecodedToken({ token: 'attqr_test_token', sessionType: 'afternoon' })}>
        Decode Afternoon QR
      </button>
    </>
  )
}));

jest.mock('../components/attendance/LocationStatusPanel', () => ({
  __esModule: true,
  default: () => <div>Location status mock</div>
}));

const waitForInitialAttendanceLoad = async () => {
  await waitFor(() => {
    expect(getTodayTeacherAttendanceMock).toHaveBeenCalled();
    expect(getTeacherAttendanceHistoryMock).toHaveBeenCalled();
  });

  await screen.findByRole('button', { name: /check in|already checked in/i });
};

describe('TeacherAttendancePage integration behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTeacherAttendanceHistoryMock.mockResolvedValue({
      success: true,
      data: {
        items: [],
        meta: { page: 1, limit: 10, total: 0 }
      }
    });
  });

  it('shows a prominent scan action and readiness summary for teachers', async () => {
    getTodayTeacherAttendanceMock.mockResolvedValueOnce({
      success: true,
      data: {
        attendance: null,
        canCheckIn: false,
        canCheckOut: false
      }
    });

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();

    expect(screen.getByRole('heading', { name: /today's attendance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan qr code/i })).toBeInTheDocument();
    expect(screen.getByText(/gps status/i)).toBeInTheDocument();
    expect(screen.getByText(/camera status/i)).toBeInTheDocument();
  });

  it('15) slow network keeps page stable and eventually renders attendance status', async () => {
    getTodayTeacherAttendanceMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              success: true,
              data: {
                attendance: null,
                canCheckIn: false,
                canCheckOut: false,
                serverTime: new Date().toISOString(),
                policy: {
                  attendanceEnabled: true,
                  attendanceQrEnabled: true,
                  attendanceGpsEnabled: true,
                  attendanceAllowedRadius: 120,
                  attendanceSchoolLatitude: 11.5564,
                  attendanceSchoolLongitude: 104.9282,
                  attendanceLateAfter: '23:59'
                }
              }
            });
          }, 200);
        })
    );

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();

    expect(screen.getByRole('heading', { name: /today's attendance/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/current status/i)).toBeInTheDocument();
    });
  });

  it('13) camera permission denied state is surfaced in attendance flow', async () => {
    getTodayTeacherAttendanceMock.mockResolvedValueOnce({
      success: true,
      data: {
        attendance: null,
        canCheckIn: false,
        canCheckOut: false
      }
    });

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();

    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));

    await waitFor(() => {
      expect(screen.getByText(/camera permission denied/i)).toBeInTheDocument();
    });
  });

  it('refreshes today state when changing from morning to afternoon', async () => {
    getTodayTeacherAttendanceMock.mockImplementation((requestedSessionType: string) => Promise.resolve({
      success: true,
      data: requestedSessionType === 'morning'
        ? {
            attendance: { status: 'LATE', checkInTime: '2026-09-14T07:33:00', checkOutTime: '2026-09-14T10:45:00' },
            canCheckIn: false,
            canCheckOut: false
          }
        : { attendance: null, canCheckIn: true, canCheckOut: false }
    }));

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();
    expect(getTodayTeacherAttendanceMock).toHaveBeenNthCalledWith(1, 'morning');
    expect(screen.getByRole('button', { name: 'Already Checked In' })).toBeInTheDocument();
    expect(screen.getByText('Check-in Time: 14/09/2026 07:33')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: /attendance session/i }), { target: { value: 'afternoon' } });

    await waitFor(() => {
      expect(getTodayTeacherAttendanceMock).toHaveBeenNthCalledWith(2, 'afternoon');
      expect(screen.getByRole('button', { name: 'Check In' })).toBeInTheDocument();
    });
    expect(screen.getByText('Check-in Time: -')).toBeInTheDocument();
  });

  it('keeps afternoon and evening today state independent', async () => {
    getTodayTeacherAttendanceMock.mockImplementation((requestedSessionType: string) => Promise.resolve({
      success: true,
      data: requestedSessionType === 'evening'
        ? { attendance: null, canCheckIn: true, canCheckOut: false }
        : { attendance: { status: 'PRESENT', checkInTime: '2026-09-14T13:30:00' }, canCheckIn: false, canCheckOut: true }
    }));

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();
    fireEvent.change(screen.getByRole('combobox', { name: /attendance session/i }), { target: { value: 'afternoon' } });
    await waitFor(() => expect(getTodayTeacherAttendanceMock).toHaveBeenNthCalledWith(2, 'afternoon'));
    expect(screen.getByRole('button', { name: 'Already Checked In' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: /attendance session/i }), { target: { value: 'evening' } });
    await waitFor(() => {
      expect(getTodayTeacherAttendanceMock).toHaveBeenNthCalledWith(3, 'evening');
      expect(screen.getByRole('button', { name: 'Check In' })).toBeInTheDocument();
    });
  });

  it('refreshes today state when an afternoon QR synchronizes the session', async () => {
    getTodayTeacherAttendanceMock.mockImplementation((requestedSessionType: string) => Promise.resolve({
      success: true,
      data: requestedSessionType === 'afternoon'
        ? { attendance: null, canCheckIn: true, canCheckOut: false }
        : { attendance: { status: 'LATE', checkInTime: '2026-09-14T07:33:00' }, canCheckIn: false, canCheckOut: false }
    }));

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    await waitForInitialAttendanceLoad();
    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Decode Afternoon QR' }));

    await waitFor(() => {
      expect(getTodayTeacherAttendanceMock).toHaveBeenNthCalledWith(2, 'afternoon');
      expect(screen.getByRole('button', { name: 'Check In' })).toBeInTheDocument();
    });
  });
});
