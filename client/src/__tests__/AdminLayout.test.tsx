import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';

describe('AdminLayout', () => {
  it('renders admin navigation and header', () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(screen.getByText(/Manage School/i)).toBeInTheDocument();
    expect(screen.getByText(/School Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Students/i)).toBeInTheDocument();
    expect(screen.getByText(/Teachers/i)).toBeInTheDocument();
    expect(screen.getByText(/Payments/i)).toBeInTheDocument();
  });
});
