import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../services/auth.api';
import { getProducts } from '../services/product.api';
import { getPromotionPlans, getSellerPromotions, purchasePromotion, PromotionPlan, PromotionRecord } from '../services/promotion.api';

const SellerPromotionsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('3_days');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setMessage('');

    try {
      const [plansData, promotionsData, profile] = await Promise.all([
        getPromotionPlans(),
        getSellerPromotions(),
        getProfile()
      ]);

      setPlans(plansData);
      setPromotions(promotionsData || []);
      setProfileLoaded(true);

      if (profile?.id) {
        const productsData = await getProducts({ seller: profile.id, page: '1', perPage: '50', sort: 'newest' });
        setProducts(productsData.items || []);
        if (!selectedProductId && productsData.items?.length) {
          setSelectedProductId(productsData.items[0]._id);
        }
      }
    } catch (error) {
      setMessage('Unable to load promotions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handlePurchase = async () => {
    if (!selectedProductId || !selectedPlanId) {
      setMessage('Please select a product and a plan.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await purchasePromotion(selectedProductId, selectedPlanId);
      setMessage('Your promotion purchase request has been submitted and is pending approval.');
      const promotionsData = await getSellerPromotions();
      setPromotions(promotionsData || []);
    } catch (error) {
      setMessage((error as any)?.response?.data?.message || 'Unable to purchase promotion.');
    } finally {
      setLoading(false);
    }
  };

  const activePromotions = useMemo(
    () => promotions.filter((item) => item.status === 'active'),
    [promotions]
  );

  const pendingPromotions = useMemo(
    () => promotions.filter((item) => item.status === 'pending'),
    [promotions]
  );

  const expiredPromotions = useMemo(
    () => promotions.filter((item) => item.status === 'expired' || item.status === 'rejected' || item.status === 'cancelled'),
    [promotions]
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!user || !isAuthenticated) {
    return null;
  }

  if (user.role !== 'seller') {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-red-900">Access Denied</h1>
          <p className="mt-4 text-sm text-red-700">Only sellers can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Featured promotions</h1>
            <p className="mt-2 text-sm text-muted">Purchase featured placement to increase visibility for your listings.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full border border-muted bg-white px-5 py-3 text-sm font-semibold text-text-primary hover:bg-background transition"
          >
            Back to dashboard
          </button>
        </div>
      </header>

      {message && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">{message}</div>
      )}

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Select product</h2>
            <p className="mt-2 text-sm text-muted">Choose a listing to promote.</p>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-4 w-full rounded-3xl border border-muted bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
            >
              {products.length ? (
                products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.title}
                  </option>
                ))
              ) : (
                <option value="">No products available</option>
              )}
            </select>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-semibold text-text-primary">Available plans</h2>
            <div className="mt-4 space-y-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full rounded-3xl border px-5 py-5 text-left transition ${
                    selectedPlanId === plan.id ? 'border-primary bg-primary/10' : 'border-muted bg-white hover:border-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{plan.label}</h3>
                      <p className="mt-1 text-sm text-text-secondary">Runs for {plan.durationDays} days</p>
                    </div>
                    <span className="rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-white">{plan.price.toLocaleString()} KHR</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handlePurchase}
              disabled={loading || !selectedProductId || !plans.length}
              className="mt-6 w-full rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-background"
            >
              {loading ? 'Submitting...' : 'Purchase featured placement'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Promotion status</h2>
                <p className="mt-2 text-sm text-muted">Track active, pending, and expired promotions in one place.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <PromotionTable title="Active promotions" items={activePromotions} formatDate={formatDate} />
              <PromotionTable title="Pending approvals" items={pendingPromotions} formatDate={formatDate} />
              <PromotionTable title="Completed promotions" items={expiredPromotions} formatDate={formatDate} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const PromotionTable = ({ title, items, formatDate }: { title: string; items: PromotionRecord[]; formatDate: (dateString?: string | null) => string }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
    {items.length ? (
      <div className="mt-4 overflow-hidden rounded-3xl border border-muted">
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 bg-background px-4 py-3 text-xs uppercase tracking-[0.25em] text-muted">
          <span>Product</span>
          <span>Status</span>
          <span>End date</span>
          <span>Plan</span>
        </div>
        <div className="divide-y divide-border bg-white">
          {items.map((promotion) => (
            <div key={promotion._id} className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-2 px-4 py-4 text-sm text-text-secondary">
              <div className="truncate">{promotion.product?.title || 'Unknown product'}</div>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${getStatusClasses(promotion.status)}`}>
                  {promotion.status}
                </span>
              </div>
              <div>{formatDate(promotion.endDate)}</div>
              <div>{promotion.plan.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="mt-4 rounded-3xl border border-dashed border-muted bg-background p-6 text-sm text-text-secondary">No {title.toLowerCase()} yet.</div>
    )}
  </div>
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

export default SellerPromotionsPage;


