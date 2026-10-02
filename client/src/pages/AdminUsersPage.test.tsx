import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminUsersPage from './AdminUsersPage';
import { createAdminLimitedUser, getAdminUsers, updateAdminUserStatus } from '../services/admin.api';

jest.mock('../services/admin.api', () => ({
  createAdminLimitedUser: jest.fn(),
  getAdminUsers: jest.fn(),
  updateAdminUserStatus: jest.fn()
}));

const mockedCreateAdminLimitedUser = jest.mocked(createAdminLimitedUser);
const mockedGetAdminUsers = jest.mocked(getAdminUsers);
const mockedUpdateAdminUserStatus = jest.mocked(updateAdminUserStatus);

describe('AdminUsersPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a limited account and refreshes the list with its inactive status', async () => {
    const createdUser = {
      _id: 'limited-1',
      displayName: 'Limited Operator',
      phoneNumber: '+85512345678',
      email: 'limited@example.com',
      role: 'LIMITED_STUDENT_PAYMENT',
      isActive: false
    };
    mockedGetAdminUsers
      .mockResolvedValueOnce({ items: [] } as any)
      .mockResolvedValueOnce({ items: [createdUser] } as any);
    mockedCreateAdminLimitedUser.mockResolvedValueOnce(createdUser as any);

    render(<AdminUsersPage />);
    await screen.findByText('No users found.');

    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));
    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: createdUser.displayName } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: createdUser.phoneNumber } });
    fireEvent.change(screen.getByLabelText('Email (optional)'), { target: { value: createdUser.email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'LimitedPass123!' } });

    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Active')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockedCreateAdminLimitedUser).toHaveBeenCalledWith({
        displayName: createdUser.displayName,
        phoneNumber: createdUser.phoneNumber,
        email: createdUser.email,
        password: 'LimitedPass123!'
      });
    });
    expect(mockedGetAdminUsers).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('LIMITED_STUDENT_PAYMENT')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Limited account created and left inactive.')).toBeInTheDocument();
  });

  it('shows the server error and keeps the form available when creation fails', async () => {
    mockedGetAdminUsers.mockResolvedValue({ items: [] } as any);
    mockedCreateAdminLimitedUser.mockRejectedValueOnce({
      response: { data: { message: 'Phone number already registered' } }
    });

    render(<AdminUsersPage />);
    await screen.findByText('No users found.');
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));
    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Duplicate User' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+85512345678' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'LimitedPass123!' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
      await Promise.resolve();
    });

    expect(await screen.findByText('Phone number already registered')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toHaveValue('Duplicate User');
  });

  it('activates an inactive account without changing its role and refreshes its status', async () => {
    const inactiveUser = {
      _id: 'limited-inactive',
      displayName: 'Limited Operator',
      role: 'LIMITED_STUDENT_PAYMENT',
      isActive: false
    };
    const activeUser = { ...inactiveUser, isActive: true };
    mockedGetAdminUsers
      .mockResolvedValueOnce({ items: [inactiveUser] } as any)
      .mockResolvedValueOnce({ items: [activeUser] } as any);
    mockedUpdateAdminUserStatus.mockResolvedValueOnce(activeUser as any);

    render(<AdminUsersPage />);
    await screen.findByText('Inactive');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
      await Promise.resolve();
    });

    expect(mockedUpdateAdminUserStatus).toHaveBeenCalledWith('limited-inactive', { isActive: true });
    expect(mockedGetAdminUsers).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByText('LIMITED_STUDENT_PAYMENT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
  });

  it('deactivates an active limited account and refreshes its status', async () => {
    const activeUser = {
      _id: 'limited-active',
      displayName: 'Limited Account',
      role: 'LIMITED_STUDENT_PAYMENT',
      isActive: true
    };
    const inactiveUser = { ...activeUser, isActive: false };
    mockedGetAdminUsers
      .mockResolvedValueOnce({ items: [activeUser] } as any)
      .mockResolvedValueOnce({ items: [inactiveUser] } as any);
    mockedUpdateAdminUserStatus.mockResolvedValueOnce(inactiveUser as any);

    render(<AdminUsersPage />);
    await screen.findByText('Active');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
      await Promise.resolve();
    });

    expect(mockedUpdateAdminUserStatus).toHaveBeenCalledWith('limited-active', { isActive: false });
    expect(mockedGetAdminUsers).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('LIMITED_STUDENT_PAYMENT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('shows the server error when account status update fails', async () => {
    const activeUser = {
      _id: 'user-active',
      displayName: 'Active Account',
      role: 'LIMITED_STUDENT_PAYMENT',
      isActive: true
    };
    mockedGetAdminUsers.mockResolvedValue({ items: [activeUser] } as any);
    mockedUpdateAdminUserStatus.mockRejectedValueOnce({
      response: { data: { message: 'Unable to update user status' } }
    });

    render(<AdminUsersPage />);
    await screen.findByText('Active');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
      await Promise.resolve();
    });

    expect(await screen.findByText('Unable to update user status')).toBeInTheDocument();
    expect(mockedGetAdminUsers).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeEnabled();
  });

  it('disables status controls while an update is in flight', async () => {
    const activeUser = {
      _id: 'active-pending',
      displayName: 'Pending Update',
      role: 'LIMITED_STUDENT_PAYMENT',
      isActive: true
    };
    const inactiveUser = { ...activeUser, isActive: false };
    let resolveStatusUpdate: ((value: any) => void) | undefined;
    mockedGetAdminUsers
      .mockResolvedValueOnce({ items: [activeUser] } as any)
      .mockResolvedValueOnce({ items: [inactiveUser] } as any);
    mockedUpdateAdminUserStatus.mockImplementationOnce(() => new Promise((resolve) => {
      resolveStatusUpdate = resolve;
    }));

    render(<AdminUsersPage />);
    await screen.findByText('Active');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
      await Promise.resolve();
    });

    const updatingButton = screen.getByRole('button', { name: 'Updating...' });
    expect(updatingButton).toBeDisabled();
    fireEvent.click(updatingButton);
    expect(mockedUpdateAdminUserStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveStatusUpdate?.(inactiveUser);
      await Promise.resolve();
    });

    expect(await screen.findByText('Inactive')).toBeInTheDocument();
  });

  it('does not offer status controls for ordinary users', async () => {
    mockedGetAdminUsers.mockResolvedValue({
      items: [{ _id: 'seller-1', displayName: 'Seller Account', role: 'seller', isActive: true }]
    } as any);

    render(<AdminUsersPage />);

    expect(await screen.findByText('Seller Account')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument();
  });
});