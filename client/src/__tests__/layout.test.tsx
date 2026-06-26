import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { AuthProvider } from '../hooks/useAuth';

// Prevent real network calls from components during tests
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
    get: jest.fn().mockResolvedValue({ data: { data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { data: {} } })
  }
}));
jest.mock('../services/favorites.api', () => ({ getFavoritesCount: jest.fn().mockResolvedValue(0) }));
jest.mock('../services/notification.api', () => ({ getNotificationsCount: jest.fn().mockResolvedValue(0) }));
jest.mock('../services/location.api', () => ({ getProvinces: jest.fn().mockResolvedValue([]), getDistricts: jest.fn().mockResolvedValue([]) }));

// Prevent tests from performing real navigation
Object.defineProperty(window, 'location', {
  value: { assign: jest.fn(), href: '' },
  writable: true
});

describe('AppShell layout', () => {
  it('renders header, children, and footer content', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell>
          <div>Test Content</div>
          </AppShell>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/Test Content/i)).toBeInTheDocument();
    const konpukLinks = screen.getAllByRole('link', { name: /Konpuk/i });
    expect(konpukLinks.length).toBeGreaterThan(0);
  });
});
