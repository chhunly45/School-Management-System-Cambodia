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

    expect(screen.getByText(/Manage platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin menu/i)).toBeInTheDocument();
    // common nav items
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Products/i)).toBeInTheDocument();
    expect(screen.getByText(/Verifications/i)).toBeInTheDocument();
  });
});
