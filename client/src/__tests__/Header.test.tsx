import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Header from '../components/layout/Header';
import api from '../services/api';
import * as favApi from '../services/favorites.api';
import * as notifApi from '../services/notification.api';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../services/favorites.api', () => ({
  __esModule: true,
  getFavoritesCount: jest.fn()
}));

jest.mock('../services/notification.api', () => ({
  __esModule: true,
  getNotificationsCount: jest.fn()
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// react-router's useNavigate is used in Header; mock it to observe navigation
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useNavigate: () => jest.fn()
  };
});

describe('Header component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
    (favApi.getFavoritesCount as jest.Mock).mockResolvedValue(0);
    (notifApi.getNotificationsCount as jest.Mock).mockResolvedValue(0);
  });

  it('renders unauthenticated links', async () => {
    const { useAuth } = require('../hooks/useAuth');
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });

    render(<Header /> , { wrapper: require('react-router-dom').MemoryRouter });

    expect((await screen.findAllByText(/ចូលគណនី/i)).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText(/បង្កើតគណនី/i)).length).toBeGreaterThanOrEqual(1);

    const toggle = screen.getByLabelText(/Toggle mobile menu/i);
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);

    const drawerNav = screen.getByRole('navigation');
    expect(within(drawerNav).getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole('link', { name: /Guide/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole('link', { name: /Help/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole('link', { name: /Post Product/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole('link', { name: /Login/i })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Close mobile menu/i));
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  it('renders desktop header with logo, help, and language switcher', async () => {
    const { useAuth } = require('../hooks/useAuth');
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });

    render(<Header /> , { wrapper: require('react-router-dom').MemoryRouter });

    expect(screen.getByAltText('Konpuk')).toBeInTheDocument();
    expect(screen.getAllByText(/Help/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/English/i)).toBeInTheDocument();
  });

  it('renders authenticated state with favorite/notification counts', async () => {
    const { useAuth } = require('../hooks/useAuth');
    useAuth.mockReturnValue({ user: { displayName: 'Test User' , profileImageUrl: '' , role: 'user' }, logout: jest.fn() });
    localStorage.setItem('authToken', 'tok');
    (favApi.getFavoritesCount as jest.Mock).mockResolvedValue(5);
    (notifApi.getNotificationsCount as jest.Mock).mockResolvedValue(2);

    render(<Header /> , { wrapper: require('react-router-dom').MemoryRouter });

    // open mobile menu to reveal account links
    const toggle = screen.getByLabelText(/Toggle mobile menu/i);
    fireEvent.click(toggle);

    await waitFor(() => expect(favApi.getFavoritesCount).toHaveBeenCalled());
    await waitFor(() => expect(notifApi.getNotificationsCount).toHaveBeenCalled());

    expect(screen.getAllByText(/ពត៌មានគណនី/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/ចេញពីប្រព័ន្ធ/i)).toBeInTheDocument();
  });

  it('handles categories fetch error gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('network'));
    const { useAuth } = require('../hooks/useAuth');
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });

    render(<Header /> , { wrapper: require('react-router-dom').MemoryRouter });

    // should not throw and login remains
    expect(await screen.findByText(/ចូលគណនី/i)).toBeInTheDocument();
  });
});
