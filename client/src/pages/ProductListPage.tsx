import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/marketplace/SearchBar';
import TopAdBanner from '../components/marketplace/TopAdBanner';
import ProductCard from '../components/marketplace/ProductCard';
import { getProducts } from '../services/product.api';
import { getProductCoverImageUrl } from '../utils/product';
import { getFavoriteIds, addFavorite, removeFavorite } from '../services/favorites.api';

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Array<any>>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const currentFilters = useMemo(() => ({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    category: searchParams.get('category') || '',
    province: searchParams.get('province') || '',
    district: searchParams.get('district') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    datePosted: searchParams.get('datePosted') || '',
    sort: searchParams.get('sort') || ''
  }), [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const loadFavoriteIds = async () => {
      try {
        const ids = await getFavoriteIds();
        setFavoriteIds(ids);
      } catch (err) {
        setFavoriteIds([]);
      }
    };

    loadFavoriteIds();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const { items, meta } = await getProducts(Object.fromEntries(searchParams.entries()));
        setProducts(items || []);
        setTotal(meta?.total || 0);
      } catch (err) {
        setError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        <section className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-text-primary">ស្វែងរកផលិតផល</h1>
          <p className="mt-2 text-sm text-text-secondary">
            ប្រើតម្រងដើម្បីបន្ថប់លទ្ធផលដោយប្រភេទ ខេត្ត លក្ខខណ្ឌ តម្លៃ និងថ្ងៃផុស។
          </p>
          <div className="mt-6">
            <SearchBar initialFilters={currentFilters} />
          </div>
        </section>

        {/* Top Advertising Banner */}
        <TopAdBanner />

        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">ផលិតផល</h2>
              <p className="text-sm text-text-secondary"><span aria-live="polite">បង្ហាញ {products.length} នៃ {total} លទ្ធផល</span></p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-muted bg-white p-8 text-center text-text-secondary">Loading products…</div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-muted bg-white p-8 text-center text-text-secondary">No products found. Try adjusting your filters.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product.slug || product._id}
                  title={product.title}
                  price={product.price}
                  location={product.location || 'Unknown'}
                  category={product.category?.labelKh || product.category?.name || 'General'}
                  seller={product.seller}
                  imageUrl={getProductCoverImageUrl(product, product.imageUrl || '')}
                  featured={product.featured || product.isFeatured}
                  viewsCount={product.viewsCount}
                  isFavorite={favoriteIds.includes(product._id)}
                  onToggleFavorite={async (productId, currentFavorite) => {
                    try {
                      if (currentFavorite) {
                        await removeFavorite(productId);
                        setFavoriteIds((current) => current.filter((id) => id !== productId));
                      } else {
                        await addFavorite(productId);
                        setFavoriteIds((current) => [...current, productId]);
                      }
                    } catch (toggleError) {
                      console.error('Favorite toggle failed:', toggleError);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductListPage;

