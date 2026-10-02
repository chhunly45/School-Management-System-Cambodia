import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentsPage from '../pages/StudentsPage';
import { useAuth } from '../hooks/useAuth';
import { listStudents } from '../services/student.api';
import { listAcademicYears } from '../services/academicYear.api';
import { listGrades } from '../services/grade.api';
import { listClasses } from '../services/class.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/student.api', () => ({
  listStudents: jest.fn(),
  createStudent: jest.fn(),
  updateStudent: jest.fn(),
  deleteStudent: jest.fn()
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

jest.mock('../components/common/DeleteConfirmationModal', () => () => null);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../utils/date', () => ({
  formatDateForApi: jest.fn(),
  formatDateForInput: (value: string) => value,
  parseLocalDate: jest.fn()
}));

describe('StudentsPage pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
    (listStudents as jest.Mock).mockResolvedValue({
      data: {
        items: [],
        meta: { page: 18, limit: 10, total: 470 }
      }
    });
    (listAcademicYears as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listGrades as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listClasses as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  it('renders the student table shell while loading student data', async () => {
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listStudents).toHaveBeenCalled();
    });

    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument();
    expect(screen.getByLabelText('Academic Year')).toBeInTheDocument();
    expect(screen.getByLabelText('Course')).toBeInTheDocument();
    expect(screen.getByLabelText('Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Room')).toBeInTheDocument();
    expect(screen.getByLabelText('Study Shift')).toBeInTheDocument();
  });

  it('does not load academic year, grade, or class lookup data for students', async () => {
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listStudents).toHaveBeenCalled();
    });

    expect(listAcademicYears).not.toHaveBeenCalled();
    expect(listGrades).not.toHaveBeenCalled();
    expect(listClasses).not.toHaveBeenCalled();
  });

  it('allows the limited role to view and create students without edit or delete controls', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'LIMITED_STUDENT_PAYMENT' } });
    (listStudents as jest.Mock).mockResolvedValue({
      data: {
        items: [{
          _id: 'student-1',
          studentId: 'S-LIMITED-1',
          fullName: 'Limited Student',
          gender: 'other',
          status: 'active'
        }],
        meta: { page: 1, limit: 10, total: 1 }
      }
    });

    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('S-LIMITED-1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/admin/students/student-1');
    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument();
    expect(screen.getByText('Add New Student')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
