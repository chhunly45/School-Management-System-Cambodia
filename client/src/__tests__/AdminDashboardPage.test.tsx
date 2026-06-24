import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import * as adminApi from '../services/admin.api';

jest.mock('../services/admin.api');
const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    mockedAdminApi.getAdminOverview.mockResolvedValue({ totalUsers: 5, totalProducts: 10, totalChats: 2, pendingReports: 1 });
    mockedAdminApi.getAdminUsers.mockResolvedValue({ items: [], meta: { page: 1, limit: 25, total: 0 } });
    mockedAdminApi.getAdminProducts.mockResolvedValue({ items: [], meta: { page: 1, limit: 25, total: 0 } });
    mockedAdminApi.getAdminReports.mockResolvedValue({ items: [], meta: { page: 1, limit: 25, total: 0 } });
  });

  it('renders overview metrics and allows tab navigation', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockedAdminApi.getAdminOverview).toHaveBeenCalled());
    expect(screen.getByText(/Total users/i)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminUsers).toHaveBeenCalled());
    expect(screen.getByText(/User management/i)).toBeInTheDocument();
  });

  it('can switch to products and reports tabs', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockedAdminApi.getAdminOverview).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /products/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminProducts).toHaveBeenCalled());
    expect(screen.getByText(/Product moderation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminReports).toHaveBeenCalled());
    expect(screen.getByText(/Report management/i)).toBeInTheDocument();
  });

  it('renders analytics cards and updates product and report status', async () => {
    mockedAdminApi.getAdminProducts.mockResolvedValueOnce({
      items: [
        {
          _id: 'p1',
          title: 'Flagged Product',
          category: { name: 'Electronics' },
          seller: { displayName: 'Seller One', email: 'seller@example.com' },
          status: 'flagged'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });

    mockedAdminApi.getAdminReports.mockResolvedValueOnce({
      items: [
        {
          _id: 'r1',
          reason: 'Spam listing',
          details: 'Suspicious content',
          reporter: { displayName: 'Reporter', email: 'reporter@example.com' },
          status: 'pending'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });

    mockedAdminApi.updateAdminProductStatus.mockResolvedValue({} as any);
    mockedAdminApi.updateAdminReportStatus.mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockedAdminApi.getAdminOverview).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /analytics/i }));
    expect(screen.getByRole('heading', { name: /Platform health/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /products/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminProducts).toHaveBeenCalled());
    expect(screen.getByText(/Flagged Product/i)).toBeInTheDocument();

    const productSelect = screen.getByRole('combobox');
    fireEvent.change(productSelect, { target: { value: 'published' } });
    await waitFor(() => expect(mockedAdminApi.updateAdminProductStatus).toHaveBeenCalledWith('p1', 'published'));

    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminReports).toHaveBeenCalled());
    expect(screen.getByText(/Spam listing/i)).toBeInTheDocument();

    const reportSelect = screen.getByRole('combobox');
    fireEvent.change(reportSelect, { target: { value: 'resolved' } });
    await waitFor(() => expect(mockedAdminApi.updateAdminReportStatus).toHaveBeenCalledWith('r1', 'resolved'));
  });

  it('updates a user role and toggles user status', async () => {
    mockedAdminApi.getAdminUsers.mockResolvedValueOnce({
      items: [
        { _id: 'u1', displayName: 'Test User', email: 'test@example.com', role: 'user', isActive: true }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminUserStatus.mockResolvedValue({ data: {} } as any);
    mockedAdminApi.getAdminUsers.mockResolvedValueOnce({
      items: [
        { _id: 'u1', displayName: 'Test User', email: 'test@example.com', role: 'admin', isActive: false }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminUsers).toHaveBeenCalled());

    const roleSelect = screen.getByDisplayValue('User');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    await waitFor(() => expect(mockedAdminApi.updateAdminUserStatus).toHaveBeenCalledWith('u1', { role: 'admin' }));
  });

  it('toggles a user from active to banned', async () => {
    mockedAdminApi.getAdminUsers.mockResolvedValueOnce({
      items: [
        { _id: 'u2', displayName: 'Active User', email: 'active@example.com', role: 'user', isActive: true }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminUserStatus.mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminUsers).toHaveBeenCalled());

    const banButton = screen.getByRole('button', { name: /ban/i });
    fireEvent.click(banButton);
    await waitFor(() => expect(mockedAdminApi.updateAdminUserStatus).toHaveBeenCalledWith('u2', { isActive: false }));
  });

  it('shows a message when updating product status fails', async () => {
    mockedAdminApi.getAdminProducts.mockResolvedValueOnce({
      items: [
        {
          _id: 'p2',
          title: 'Review Product',
          category: { name: 'Electronics' },
          seller: { displayName: 'Seller Two', email: 'seller2@example.com' },
          status: 'published'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminProductStatus.mockRejectedValueOnce(new Error('Update failed'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /products/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminProducts).toHaveBeenCalled());

    const productSelect = screen.getByRole('combobox');
    fireEvent.change(productSelect, { target: { value: 'flagged' } });
    await waitFor(() => expect(screen.getByText(/Unable to update product status\./i)).toBeInTheDocument());
  });

  it('shows a message when updating report status fails', async () => {
    mockedAdminApi.getAdminReports.mockResolvedValueOnce({
      items: [
        {
          _id: 'r2',
          reason: 'Fake report',
          details: 'Needs review',
          reporter: { displayName: 'Reporter Two', email: 'rep2@example.com' },
          status: 'pending'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminReportStatus.mockRejectedValueOnce(new Error('Update failed'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminReports).toHaveBeenCalled());

    const reportSelect = screen.getByRole('combobox');
    fireEvent.change(reportSelect, { target: { value: 'resolved' } });
    await waitFor(() => expect(screen.getByText(/Unable to update report status\./i)).toBeInTheDocument());
  });

  it('shows a message when user management fails to load', async () => {
    mockedAdminApi.getAdminUsers.mockRejectedValueOnce(new Error('Server error'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(screen.getByText(/Unable to load users\./i)).toBeInTheDocument());
  });

  it('shows a message when product moderation fails to load', async () => {
    mockedAdminApi.getAdminProducts.mockRejectedValueOnce(new Error('Server error'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /products/i }));
    await waitFor(() => expect(screen.getByText(/Unable to load products\./i)).toBeInTheDocument());
  });

  it('shows a message when reports fail to load', async () => {
    mockedAdminApi.getAdminReports.mockRejectedValueOnce(new Error('Server error'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await waitFor(() => expect(screen.getByText(/Unable to load reports\./i)).toBeInTheDocument());
  });

  it('shows a message when overview fails to load', async () => {
    mockedAdminApi.getAdminOverview.mockRejectedValueOnce(new Error('Overview failure'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Unable to load overview\./i)).toBeInTheDocument());
  });

  it('shows a message when toggling user status fails', async () => {
    mockedAdminApi.getAdminUsers.mockResolvedValueOnce({
      items: [
        { _id: 'u3', displayName: 'Test Toggle', email: 'toggle@example.com', role: 'user', isActive: true }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminUserStatus.mockRejectedValueOnce(new Error('Toggle failed'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminUsers).toHaveBeenCalled());

    const banButton = screen.getByRole('button', { name: /ban/i });
    fireEvent.click(banButton);
    await waitFor(() => expect(screen.getByText(/Unable to update user status\./i)).toBeInTheDocument());
  });

  it('shows a message when updating a user role fails', async () => {
    mockedAdminApi.getAdminUsers.mockResolvedValueOnce({
      items: [
        { _id: 'u1', displayName: 'Test User', email: 'test@example.com', role: 'user', isActive: true }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.updateAdminUserStatus.mockRejectedValueOnce(new Error('Update failed'));

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /users/i }));
    await waitFor(() => expect(mockedAdminApi.getAdminUsers).toHaveBeenCalled());

    const roleSelect = screen.getByDisplayValue('User');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    await waitFor(() => expect(screen.getByText(/Unable to update user role\./i)).toBeInTheDocument());
  });

  it('renders archived product status and report fallback text', async () => {
    mockedAdminApi.getAdminProducts.mockResolvedValueOnce({
      items: [
        {
          _id: 'p3',
          title: 'Archived Product',
          category: { name: 'Tools' },
          seller: { displayName: 'Seller X', email: 'sellerx@example.com' },
          status: 'archived'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });
    mockedAdminApi.getAdminReports.mockResolvedValueOnce({
      items: [
        {
          _id: 'r3',
          reason: '',
          details: '',
          reporter: null,
          status: 'rejected'
        }
      ],
      meta: { page: 1, limit: 25, total: 1 }
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /products/i }));
    await waitFor(() => expect(screen.getByText(/Archived Product/i)).toBeInTheDocument());
    const productRow = screen.getByText(/Archived Product/i).closest('tr');
    expect(productRow).not.toBeNull();
    const cells = within(productRow!).getAllByRole('cell');
    // status is the 3rd cell in the row
    expect(within(cells[2]).getByText(/^archived$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    await waitFor(() => expect(screen.getByText(/No details provided/i)).toBeInTheDocument());
    // scope reporter and status assertions to the report row
    const flaggedEls = screen.getAllByText(/Flagged content/i);
    const flaggedEl = flaggedEls.find((el) => el.closest('tr') !== null);
    expect(flaggedEl).toBeDefined();
    const reportRow = flaggedEl!.closest('tr');
    expect(reportRow).not.toBeNull();
    expect(within(reportRow!).getByText(/Anonymous/i)).toBeInTheDocument();
    const reportCells = within(reportRow!).getAllByRole('cell');
    expect(within(reportCells[2]).getByText(/^rejected$/i)).toBeInTheDocument();
  });
});
