import { fireEvent, render, screen } from '@testing-library/react';
import AttendanceActionCard from './AttendanceActionCard';

describe('AttendanceActionCard', () => {
  it('renders title, description, and children then triggers action', () => {
    const onAction = jest.fn();

    render(
      <AttendanceActionCard
        title="Check In"
        description="Capture your check-in"
        actionLabel="Check In Now"
        onAction={onAction}
      >
        <p>Extra slot</p>
      </AttendanceActionCard>
    );

    expect(screen.getByText('Check In')).toBeInTheDocument();
    expect(screen.getByText('Capture your check-in')).toBeInTheDocument();
    expect(screen.getByText('Extra slot')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check In Now' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows busy label and disables button while busy', () => {
    render(
      <AttendanceActionCard
        title="Check Out"
        description="Finish attendance"
        actionLabel="Check Out"
        onAction={jest.fn()}
        busy
      />
    );

    const button = screen.getByRole('button', { name: 'Processing...' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
