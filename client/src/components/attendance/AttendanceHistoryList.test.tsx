import { render, screen } from '@testing-library/react';
import AttendanceHistoryList from './AttendanceHistoryList';
import type { TeacherAttendanceRecord } from '../../services/teacherAttendance.api';

describe('AttendanceHistoryList', () => {
  it('shows empty state for no records', () => {
    render(<AttendanceHistoryList items={[]} />);
    expect(screen.getByText('No attendance records found.')).toBeInTheDocument();
  });

  it('renders attendance rows for both mobile and table layouts', () => {
    const items: TeacherAttendanceRecord[] = [
      {
        _id: 'a1',
        teacherId: 't1',
        userId: 'u1',
        attendanceDate: '2026-08-07T00:00:00.000Z',
        checkInTime: '2026-08-07T01:00:00.000Z',
        checkOutTime: '2026-08-07T09:00:00.000Z',
        attendanceMethod: 'QR',
        status: 'PRESENT',
        distanceFromSchool: 45.6
      }
    ];

    render(<AttendanceHistoryList items={items} />);

    expect(screen.getAllByText('QR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Present').length).toBeGreaterThan(0);
    expect(screen.getAllByText('46 m').length).toBeGreaterThan(0);
  });
});
