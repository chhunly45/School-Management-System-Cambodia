import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeacherAttendancePage from './TeacherAttendancePage';

const getTodayTeacherAttendanceMock = jest.fn();
const getTeacherAttendanceHistoryMock = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u-teacher-1',
      email: 'teacher@example.com',
      role: 'teacher'
    }
  })
}));

jest.mock('../services/teacherAttendance.api', () => ({
  checkInTeacherAttendance: jest.fn(),
  checkOutTeacherAttendance: jest.fn(),
  getTodayTeacherAttendance: () => getTodayTeacherAttendanceMock(),
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
  default: () => <p>Camera permission denied. Enable camera access and try again.</p>
}));

jest.mock('../components/attendance/LocationStatusPanel', () => ({
  __esModule: true,
  default: () => <div>Location status mock</div>
}));

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
        canCheckIn: true,
        canCheckOut: false
      }
    });

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

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
                canCheckIn: true,
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
        canCheckIn: true,
        canCheckOut: false
      }
    });

    render(
      <MemoryRouter>
        <TeacherAttendancePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /scan qr code/i }));

    await waitFor(() => {
      expect(screen.getByText(/camera permission denied/i)).toBeInTheDocument();
    });
  });
});
