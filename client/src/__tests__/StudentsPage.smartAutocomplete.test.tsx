import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import StudentsPage from '../pages/StudentsPage';
import { useAuth } from '../hooks/useAuth';
import { listStudents } from '../services/student.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/student.api', () => ({
  listStudents: jest.fn(),
  createStudent: jest.fn(),
  updateStudent: jest.fn(),
  deleteStudent: jest.fn()
}));

jest.mock('../components/common/DeleteConfirmationModal', () => () => null);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('StudentsPage smart suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
    (listStudents as jest.Mock).mockResolvedValue({
      data: {
        items: [],
        meta: { page: 1, limit: 10, total: 0 }
      }
    });
  });

  const withAct = async (action: () => Promise<void>) => {
    await act(async () => {
      await action();
    });
  };

  it('shows academic year suggestions and allows custom values', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listStudents).toHaveBeenCalled());

    const academicYearInput = screen.getByLabelText('Academic Year');
    await withAct(async () => {
      await user.click(academicYearInput);
    });

    await waitFor(() => {
      expect(screen.getByText('2025-2026')).toBeInTheDocument();
      expect(screen.getByText('2026-2027')).toBeInTheDocument();
      expect(screen.getByText('2027-2028')).toBeInTheDocument();
      expect(screen.getByText('2028-2029')).toBeInTheDocument();
    });

    await withAct(async () => {
      await user.clear(academicYearInput);
      await user.type(academicYearInput, '2030-2031');
    });
    await waitFor(() => expect((academicYearInput as HTMLInputElement).value).toBe('2030-2031'));
  });

  it('shows course suggestions and allows custom values', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listStudents).toHaveBeenCalled());

    const courseInput = screen.getByLabelText('Course');
    await withAct(async () => {
      await user.click(courseInput);
    });

    await waitFor(() => {
      expect(screen.getByText('First Friends')).toBeInTheDocument();
      expect(screen.getByText('Super Kids')).toBeInTheDocument();
      expect(screen.getByText('Headway')).toBeInTheDocument();
    });

    await withAct(async () => {
      await user.clear(courseInput);
      await user.type(courseInput, 'New Course');
    });
    await waitFor(() => expect((courseInput as HTMLInputElement).value).toBe('New Course'));
  });

  it('updates level suggestions based on selected course', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listStudents).toHaveBeenCalled());

    const courseInput = screen.getByLabelText('Course');
    await withAct(async () => {
      await user.click(courseInput);
    });
    await screen.findByText('First Friends');
    await withAct(async () => {
      await user.click(screen.getByText('First Friends'));
    });

    const levelInput = screen.getByLabelText('Level');
    await withAct(async () => {
      await user.click(levelInput);
    });

    await waitFor(() => {
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    });

    await withAct(async () => {
      await user.clear(courseInput);
      await user.type(courseInput, 'Super Kids');
    });
    await withAct(async () => {
      await user.click(levelInput);
    });

    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 6')).toBeInTheDocument();
    expect(screen.queryByText('Upper Intermediate')).not.toBeInTheDocument();

    await withAct(async () => {
      await user.clear(courseInput);
      await user.type(courseInput, 'Headway');
    });
    await withAct(async () => {
      await user.click(levelInput);
    });

    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('shows room suggestions and allows custom room values', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listStudents).toHaveBeenCalled());

    const roomInput = screen.getByLabelText('Room');
    await withAct(async () => {
      await user.click(roomInput);
    });

    await waitFor(() => {
      for (let i = 1; i <= 10; i += 1) {
        expect(screen.getByText(`Room ${i}`)).toBeInTheDocument();
      }
    });

    await withAct(async () => {
      await user.clear(roomInput);
      await user.type(roomInput, 'New Room');
    });
    await waitFor(() => expect((roomInput as HTMLInputElement).value).toBe('New Room'));
  });

  it('shows study shift options', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(listStudents).toHaveBeenCalled());

    const shiftInput = screen.getByLabelText('Study Shift');
    await withAct(async () => {
      await user.click(shiftInput);
    });

    await screen.findByText('Morning');
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });
});
