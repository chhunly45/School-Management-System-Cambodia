import { useEffect, useState } from 'react';
import { approvePromotion, cancelPromotion, extendPromotion, getAdminPromotionMetrics, getAdminPromotions, rejectPromotion } from '../services/promotion.api';
import { useNavigate } from 'react-router-dom';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ activePromotions: 0, expiredPromotions: 0, revenueFromPromotions: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [extendDays, setExtendDays] = useState<number>(7);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [promotionsData, metricsData] = await Promise.all([getAdminPromotions(), getAdminPromotionMetrics()]);
      setPromotions(promotionsData.items || promotionsData || []);
      setMetrics(metricsData || { activePromotions: 0, expiredPromotions: 0, revenueFromPromotions: 0 });
    } catch {
      // If promotions data is not available, show empty state instead of error banner
      setPromotions([]);
      setMetrics({ activePromotions: 0, expiredPromotions: 0, revenueFromPromotions: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (promotionId: string) => {
    setLoading(true);
    setMessage('');
    try {
      await approvePromotion(promotionId);
      await loadData();
    } catch {
      setMessage('Unable to approve promotion.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (promotionId: string) => {
    const reason = window.prompt('Please provide a rejection reason.');
    if (reason === null) return;
    setLoading(true);
    setMessage('');
    try {
      await rejectPromotion(promotionId, reason.trim() || 'Rejected by admin');
      await loadData();
    } catch {
      setMessage('Unable to reject promotion.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (promotionId: string) => {
    setLoading(true);
    setMessage('');
    try {
      await extendPromotion(promotionId, extendDays);
      await loadData();
    } catch {
      setMessage('Unable to extend promotion.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (promotionId: string) => {
    if (!window.confirm('Cancel this promotion and remove the featured status?')) return;
    setLoading(true);
    setMessage('');
    try {
      await cancelPromotion(promotionId);
      await loadData();
    } catch {
      setMessage('Unable to cancel promotion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-muted">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Promotions dashboard</h1>
            <p className="mt-2 text-sm text-text-secondary">Approve featured placement requests and monitor monetization performance.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-full border border-muted bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-background transition"
          >
            Back to admin
          </button>
        </div>
      </header>

      {message && <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}

      <section className="grid gap-6 xl:grid-cols-3">
        <StatCard label="Active promotions" value={metrics.activePromotions} />
        <StatCard label="Expired promotions" value={metrics.expiredPromotions} />
        <StatCard label="Revenue from promotions" value={`${metrics.revenueFromPromotions.toLocaleString()} KHR`} />
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-muted">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Promotion requests</h2>
            <p className="mt-2 text-sm text-text-secondary">Review pending purchases and manage active campaigns.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">Extend days</label>
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(event) => setExtendDays(Number(event.target.value))}
              className="w-24 rounded-2xl border border-muted px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-muted bg-background p-12 text-center text-text-secondary">Loading promotions…</div>
        ) : promotions.length ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-muted text-sm shadow-sm">
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr_2fr] gap-2 bg-background px-4 py-3 text-xs uppercase tracking-[0.24em] text-text-secondary">
              <span>Product</span>
              <span>Seller</span>
              <span>Status</span>
              <span>End date</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-muted bg-white">
              {promotions.map((promotion) => (
                <div key={promotion._id} className="grid grid-cols-[3fr_1fr_1fr_1fr_2fr] gap-2 px-4 py-4 text-sm text-text-secondary">
                  <div>{promotion.product?.title || 'Unknown product'}</div>
                  <div>{promotion.seller?.displayName || promotion.seller?.email || 'Unknown'}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${getStatusClasses(promotion.status)}`}>
                      {promotion.status}
                    </span>
                  </div>
                  <div>{promotion.endDate ? new Date(promotion.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {promotion.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(promotion._id)}
                          className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(promotion._id)}
                          className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {promotion.status !== 'cancelled' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleExtend(promotion._id)}
                          className="rounded-full bg-text-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition"
                        >
                          Extend
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(promotion._id)}
                          className="rounded-full bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-muted bg-background p-12 text-center text-text-secondary">No promotions found.</div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
    <p className="text-sm uppercase tracking-[0.35em] text-muted">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-text-primary">{value}</p>
  </article>
);

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    case 'expired':
      return 'bg-background text-text-secondary';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    case 'cancelled':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-background text-text-secondary';
  }
};

export default AdminPromotionsPage;


