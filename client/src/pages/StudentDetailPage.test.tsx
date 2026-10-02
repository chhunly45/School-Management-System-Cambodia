import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StudentDetailPage from './StudentDetailPage';
import { useAuth } from '../hooks/useAuth';
import { getStudent } from '../services/student.api';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../services/student.api', () => ({
  getStudent: jest.fn()
}));

describe('StudentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'LIMITED_STUDENT_PAYMENT' } });
    (getStudent as jest.Mock).mockResolvedValue({
      data: {
        _id: 'student-1',
        studentId: 'S-LIMITED-1',
        fullName: 'Limited Student',
        gender: 'other',
        phone: '+85512345678',
        guardianName: 'Guardian One',
        status: 'active'
      }
    });
  });

  it('loads and displays read-only Student details for the limited role', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/students/student-1']}>
        <Routes>
          <Route path="/admin/students/:id" element={<StudentDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getStudent).toHaveBeenCalledWith('student-1'));
    expect(await screen.findAllByText('Limited Student')).toHaveLength(2);
    expect(screen.getByText('S-LIMITED-1')).toBeInTheDocument();
    expect(screen.getByText('+85512345678')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Students' })).toHaveAttribute('href', '/admin/students');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});