import { useEffect, useState } from 'react';
import { createAdminLimitedUser, getAdminUsers, updateAdminUserStatus } from '../services/admin.api';

interface CreateUserFormValues {
  displayName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

const emptyCreateUserForm: CreateUserFormValues = {
  displayName: '',
  phoneNumber: '',
  email: '',
  password: ''
};

interface AdminUser {
  _id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateUserFormValues>(emptyCreateUserForm);
  const [message, setMessage] = useState('');

  const loadUsers = async (preserveMessage = false) => {
    setLoading(true);
    if (!preserveMessage) setMessage('');

    try {
      const data = await getAdminUsers({ page: 1, limit: 100 });
      setUsers(Array.isArray(data) ? data : data.items || []);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to load users right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      await createAdminLimitedUser({
        displayName: formValues.displayName.trim(),
        phoneNumber: formValues.phoneNumber.trim(),
        email: formValues.email.trim() || undefined,
        password: formValues.password
      });
      setFormValues(emptyCreateUserForm);
      setCreateFormOpen(false);
      setMessage('Limited account created and left inactive.');
      await loadUsers(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to create user right now.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleLimitedUserStatus = async (user: AdminUser) => {
    if (user.role !== 'LIMITED_STUDENT_PAYMENT') return;

    const nextIsActive = user.isActive === false;
    setUpdatingUserId(user._id);
    setMessage('');

    try {
      await updateAdminUserStatus(user._id, { isActive: nextIsActive });
      setMessage(nextIsActive ? 'User activated successfully.' : 'User deactivated successfully.');
      await loadUsers(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to update user status right now.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">School Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-text-primary">User Management</h1>
        <p className="mt-2 text-sm text-muted">Review account access and status across the school system.</p>
      </header>

      <button
        type="button"
        onClick={() => setCreateFormOpen((open) => !open)}
        aria-expanded={createFormOpen}
        className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {createFormOpen ? 'Cancel' : 'Create User'}
      </button>

      {createFormOpen && (
        <form onSubmit={handleCreateUser} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
          <h2 className="text-xl font-semibold text-text-primary">Create limited account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-text-secondary">
              <span>Display Name</span>
              <input
                type="text"
                value={formValues.displayName}
                onChange={(event) => setFormValues((values) => ({ ...values, displayName: event.target.value }))}
                autoComplete="name"
                required
                disabled={creating}
                className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-text-secondary">
              <span>Phone Number</span>
              <input
                type="tel"
                value={formValues.phoneNumber}
                onChange={(event) => setFormValues((values) => ({ ...values, phoneNumber: event.target.value }))}
                autoComplete="tel"
                required
                disabled={creating}
                className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-text-secondary">
              <span>Email (optional)</span>
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => setFormValues((values) => ({ ...values, email: event.target.value }))}
                autoComplete="email"
                disabled={creating}
                className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-text-secondary">
              <span>Password</span>
              <input
                type="password"
                value={formValues.password}
                onChange={(event) => setFormValues((values) => ({ ...values, password: event.target.value }))}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={creating}
                className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create account'}
          </button>
        </form>
      )}

      {message && (
        <div className="rounded-3xl border border-warning/30 bg-background p-4 text-sm text-warning">{message}</div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-border">
        {loading ? (
          <div className="p-12 text-center text-text-secondary">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background text-left text-xs uppercase tracking-[0.2em] text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Display Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user._id} className="text-text-primary">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">{user.displayName || 'Unnamed user'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text-secondary">{user.email || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-text-secondary">{user.phoneNumber || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 capitalize">{user.role || 'user'}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={user.isActive === false ? 'text-red-700' : 'text-emerald-700'}>
                        {user.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.role === 'LIMITED_STUDENT_PAYMENT' && (
                        <button
                          type="button"
                          onClick={() => void handleToggleLimitedUserStatus(user)}
                          disabled={updatingUserId !== null}
                          className="rounded-full border border-muted px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingUserId === user._id
                            ? 'Updating...'
                            : user.isActive === false
                            ? 'Activate'
                            : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsersPage;
