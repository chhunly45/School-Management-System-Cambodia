import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/auth.api';
import { getProducts, updateProduct, deleteProduct } from '../services/product.api';
import { getSellerPromotions, PromotionRecord } from '../services/promotion.api';
import { Edit3, Trash2, CheckCircle, PlusCircle, Eye, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { formatViewsCount } from '../utils/views';
import { formatPriceKHR, formatPriceUSD } from '../utils/price';

const DashboardPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');
    try {
      const profile = await getProfile();
      setUser(profile);

      if (profile?.id) {
        const [productResponse, promotionResponse] = await Promise.all([
          getProducts({ seller: profile.id, page: '1', perPage: '50', sort: 'newest' }),
          getSellerPromotions()
        ]);

        setProducts(productResponse.items || []);
        setPromotions(promotionResponse || []);
      }
    } catch (error) {
      setMessage('Unable to load your dashboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleMarkSold = async (productId: string) => {
    try {
      await updateProduct(productId, { status: 'sold' });
      setMessage('Product marked as sold.');
      loadDashboard();
    } catch (error) {
      setMessage('Could not update product status.');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(productId);
      setMessage('Product deleted successfully.');
      setProducts((current) => current.filter((item) => item._id !== productId));
    } catch (error) {
      setMessage('Unable to delete product.');
    }
  };

  const activeCount = products.filter((product) => product.status === 'published').length;
  const soldCount = products.filter((product) => product.status === 'sold').length;
  const draftCount = products.filter((product) => product.status === 'draft').length;
  const totalViews = products.reduce((sum, product) => sum + (product.viewsCount || 0), 0);
  const mostViewedProducts = [...products]
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 5);

  const activePromotionCount = promotions.filter((promotion) => promotion.status === 'active').length;
  const pendingPromotionCount = promotions.filter((promotion) => promotion.status === 'pending').length;
  const expiringSoonCount = promotions.filter((promotion) => {
    if (promotion.status !== 'active' || !promotion.endDate) return false;
    const now = Date.now();
    const endDate = new Date(promotion.endDate).getTime();
    return endDate > now && endDate - now <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const promotionSpend = promotions
    .filter((promotion) => promotion.status !== 'rejected')
    .reduce((sum, promotion) => sum + (promotion.price || 0), 0);

  const formatPromotionDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text-primary">Seller dashboard</h1>
            <p className="mt-2 text-sm text-muted">Manage your active listings, update status, and keep track of your products.</p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/admin/banners')}
                  className="inline-flex items-center gap-2 rounded-full border border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background transition"
                >
                  Manage Banners
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/revenue')}
                  className="inline-flex items-center gap-2 rounded-full border border-muted bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background transition"
                >
                  Revenue Dashboard
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => navigate('/post-product')}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
            >
              <PlusCircle className="w-4 h-4" /> Post new listing
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-5">
        {[
          { label: 'Total listings', value: products.length, icon: PlusCircle },
          { label: 'Active listings', value: activeCount, icon: TrendingUp },
          { label: 'Sold items', value: soldCount, icon: CheckCircle },
          { label: 'Total views', value: totalViews, icon: Eye },
          { label: 'Drafts', value: draftCount, icon: PlusCircle }
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-text-primary">{stat.label === 'Total views' ? formatViewsCount(stat.value as number) : stat.value}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        {[
          { label: 'Active promotions', value: activePromotionCount, icon: TrendingUp },
          { label: 'Pending promotions', value: pendingPromotionCount, icon: Clock },
          { label: 'Expiring soon', value: expiringSoonCount, icon: Clock },
          { label: 'Spent on promotions', value: promotionSpend.toLocaleString(), icon: DollarSign }
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-text-primary">{stat.value}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Promoted Products</h2>
            <p className="mt-2 text-sm text-muted">Review all promotion activity for your products.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/seller/promotions')}
            className="inline-flex items-center justify-center rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            Promote Another Product
          </button>
        </div>

        {promotions.length ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-muted">
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-2 bg-background px-4 py-3 text-xs uppercase tracking-[0.25em] text-muted">
              <span>Product</span>
              <span>Plan</span>
              <span>Start date</span>
              <span>Expires</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border bg-white">
              {promotions.map((promotion) => (
                <div key={promotion._id} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-4 text-sm text-text-secondary">
                  <div className="truncate">{promotion.product?.title || 'Unknown product'}</div>
                  <div>{promotion.plan.replace('_', ' ')}</div>
                  <div>{formatPromotionDate(promotion.startDate)}</div>
                  <div>{formatPromotionDate(promotion.endDate)}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${promotion.status === 'active' ? 'bg-emerald-100 text-emerald-700' : promotion.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-background text-text-secondary'}`}>
                      {promotion.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-muted bg-background p-8 text-center text-text-secondary">
            <p className="text-lg font-semibold">No promoted products yet</p>
            <p className="mt-2 text-sm">Use the promotion page to feature your listings and boost visibility.</p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary">Most viewed products</h2>
          <p className="mt-2 text-sm text-muted">Your top performing listings based on view count.</p>
        </div>

        {mostViewedProducts.length ? (
          <div className="mt-6 space-y-3">
            {mostViewedProducts.map((product, idx) => (
              <div key={product._id} className="flex items-center gap-4 rounded-2xl border border-muted bg-background p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-text-primary">{product.title}</p>
                  <p className="text-xs text-muted">{product.category?.labelKh || product.category?.name || 'General'}</p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">{formatViewsCount(product.viewsCount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-muted bg-background p-8 text-center text-text-secondary">
            <p>No products with views yet. Create and share your listings to get views.</p>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Manage your ads</h2>
            <p className="mt-2 text-sm text-muted">Edit, delete, or mark your products as sold from one place.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/post-product')}
            className="rounded-full bg-text-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            Create listing
          </button>
        </div>

        {message && <div className="mt-6 rounded-3xl border border-muted bg-background p-4 text-sm text-text-secondary">{message}</div>}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-muted bg-background p-12 text-center text-text-secondary">Loading your listings…</div>
        ) : products.length ? (
          <div className="mt-6 grid gap-4">
            {products.map((product) => (
              <article key={product._id} className="rounded-3xl border border-muted bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-text-primary">{product.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-text-secondary">
                      <span>{product.category?.labelKh || product.category?.name || 'General'}</span>
                      <span>{product.location || 'Unknown location'}</span>
                      <span>{formatPriceUSD(product.price)} {formatPriceKHR(product.price)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {product.status === 'sold' ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Sold</span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">{product.status || 'Published'}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/post-product?id=${product._id}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-text-secondary ring-1 ring-border hover:bg-background transition"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    {product.status !== 'sold' && (
                      <button
                        type="button"
                        onClick={() => handleMarkSold(product._id)}
                        className="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark sold
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-muted bg-background p-12 text-center text-text-secondary">
            <p className="text-lg font-semibold">No active ads yet</p>
            <p className="mt-2 text-sm">Create your first listing to start selling.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;


