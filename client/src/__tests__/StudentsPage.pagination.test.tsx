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

  it('renders compact pagination with first/last pages and ellipsis for skipped ranges', async () => {
    render(
      <MemoryRouter>
        <StudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listStudents).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '47' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '18' })).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
