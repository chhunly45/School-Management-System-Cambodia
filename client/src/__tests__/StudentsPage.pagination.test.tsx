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
    expect(screen.getByText('Academic Year')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Room')).toBeInTheDocument();
    expect(screen.getByText('Study Shift')).toBeInTheDocument();
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
});
