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

    const teachersLink = screen.getByRole('link', { name: 'Teachers' });
    expect(teachersLink).toHaveClass('text-base', 'py-3.5', 'lg:text-sm', 'lg:py-3');
    expect(teachersLink.querySelector('svg')).toHaveClass('h-5', 'w-5');
  });
});
