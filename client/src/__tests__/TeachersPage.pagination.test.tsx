import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeachersPage from '../pages/TeachersPage';
import { useAuth } from '../hooks/useAuth';
import { listTeachers } from '../services/teacher.api';
import { listSubjects } from '../services/subject.api';
import { listClasses } from '../services/class.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/teacher.api', () => ({
  listTeachers: jest.fn(),
  createTeacher: jest.fn(),
  updateTeacher: jest.fn(),
  deleteTeacher: jest.fn()
}));

jest.mock('../services/subject.api', () => ({
  listSubjects: jest.fn()
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

describe('TeachersPage pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'admin' } });
    (listTeachers as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listSubjects as jest.Mock).mockResolvedValue({ data: { items: [] } });
    (listClasses as jest.Mock).mockResolvedValue({ data: { items: [] } });
  });

  it('requests teachers with the backend-supported perPage maximum', async () => {
    render(
      <MemoryRouter>
        <TeachersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listTeachers).toHaveBeenCalledWith(expect.objectContaining({ perPage: 100, includeRelations: true }));
    });

    expect(screen.getAllByText(/Teachers/i).length).toBeGreaterThan(0);
  });
});
