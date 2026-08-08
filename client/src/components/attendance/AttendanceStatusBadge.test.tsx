import { render, screen } from '@testing-library/react';
import AttendanceStatusBadge from './AttendanceStatusBadge';

describe('AttendanceStatusBadge', () => {
  it('renders present status with readable label', () => {
    render(<AttendanceStatusBadge status="PRESENT" />);
    expect(screen.getByText('Present')).toBeInTheDocument();
  });

  it('renders not checked in fallback label', () => {
    render(<AttendanceStatusBadge status="NOT_CHECKED_IN" />);
    expect(screen.getByText('Not Checked In')).toBeInTheDocument();
  });
});
