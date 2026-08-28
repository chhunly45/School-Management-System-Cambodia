import { useEffect, useState } from 'react';
import { getAdminUsers } from '../services/admin.api';

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
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setMessage('');

      try {
        const data = await getAdminUsers({ page: 1, limit: 100 });
        setUsers(Array.isArray(data) ? data : data.items || []);
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Unable to load users right now.');
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">School Admin</p>
        <h1 className="mt-3 text-3xl font-semibold text-text-primary">User Management</h1>
        <p className="mt-2 text-sm text-muted">Review account access and status across the school system.</p>
      </header>

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
