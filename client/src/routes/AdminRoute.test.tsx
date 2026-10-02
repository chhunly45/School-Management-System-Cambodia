import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import { useAuth } from '../hooks/useAuth';

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const mockedUseAuth = jest.mocked(useAuth);

const renderAtAdminPath = (role: string, path: string) => {
  mockedUseAuth.mockReturnValue({ user: { id: 'user-1', displayName: role, role } } as any);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminRoute />}>
          <Route index element={<p>Admin dashboard page</p>} />
          <Route path="users" element={<p>User management page</p>} />
          <Route path="students" element={<p>Student page</p>} />
          <Route path="students/:id" element={<p>Student detail page</p>} />
          <Route path="payments" element={<p>Payment page</p>} />
          <Route path="finance/payment-tracking" element={<p>Payment tracking page</p>} />
          <Route path="school-settings" element={<p>School settings page</p>} />
          <Route path="teachers" element={<p>Teachers page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('AdminRoute role access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['/admin/students', '/admin/payments'])('allows limited users on %s', (path) => {
    renderAtAdminPath('LIMITED_STUDENT_PAYMENT', path);

    expect(screen.getByText(path.endsWith('students') ? 'Student page' : 'Payment page')).toBeInTheDocument();
  });

  it('allows a limited user to open one Student detail route', () => {
    renderAtAdminPath('LIMITED_STUDENT_PAYMENT', '/admin/students/student-1');

    expect(screen.getByText('Student detail page')).toBeInTheDocument();
  });

  it.each([
    '/admin',
    '/admin/users',
    '/admin/finance/payment-tracking',
    '/admin/school-settings',
    '/admin/teachers'
  ])('blocks limited users on restricted route %s', (path) => {
    renderAtAdminPath('LIMITED_STUDENT_PAYMENT', path);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it.each(['user', 'seller', 'moderator', 'teacher'])('keeps %s blocked from Admin routes', (role) => {
    renderAtAdminPath(role, '/admin/students');

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('preserves Admin access to other Admin modules', () => {
    renderAtAdminPath('admin', '/admin/users');

    expect(screen.getByText('User management page')).toBeInTheDocument();
  });
});