import { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUserStatus } from '../services/admin.api';

const AdminVerificationReviewPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSellers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await getAdminUsers({ role: 'seller' });
      setSellers(data.items || []);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to load seller verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleUpdateStatus = async (userId: string, status: 'verified' | 'rejected') => {
    setLoading(true);
    setMessage('');
    try {
      await updateAdminUserStatus(userId, { sellerVerificationStatus: status });
      await loadSellers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Unable to update seller verification status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Admin review</p>
            <h1 className="text-3xl font-semibold text-text-primary">Seller verification requests</h1>
            <p className="mt-2 text-sm text-muted">Approve or reject seller verification requests from registered sellers.</p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-3xl border border-warning/30 bg-background p-4 text-sm text-warning">{message}</div>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl border border-muted bg-background shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-white text-text-secondary">
              <tr>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Seller</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Email</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Verification status</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-text-secondary">
                    {loading ? 'Loading sellers…' : 'No seller verification requests found.'}
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{seller.displayName}</div>
                      <div className="mt-1 text-sm text-muted">{seller.location || 'No location'}</div>
                    </td>
                    <td className="px-6 py-4">{seller.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${seller.sellerVerificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' : seller.sellerVerificationStatus === 'unverified' ? 'bg-amber-100 text-amber-700' : 'bg-background text-text-secondary'}`}>
                        {seller.sellerVerificationStatus || 'unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(seller._id, 'verified')}
                        disabled={loading}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(seller._id, 'rejected')}
                        disabled={loading}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVerificationReviewPage;
