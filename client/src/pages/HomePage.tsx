import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/marketplace/SearchBar';
import SEO from '../components/SEO';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getProducts, getFeaturedProducts } from '../services/product.api';
import ProductCard from '../components/marketplace/ProductCard';
import { getCategoryLabel } from '../utils/category';
import { getProductCoverImageUrl } from '../utils/product';

const categories = [
  { name: 'ម្ហូបអាហារ', icon: '🍜', slug: 'food', count: 125 },
  { name: 'សំលៀកបំពាក់', icon: '👕', slug: 'clothing', count: 89 },
  { name: 'ឯកសារ', icon: '📱', slug: 'electronics', count: 234 },
  { name: 'អចលនទ្រព្យ', icon: '🏠', slug: 'home', count: 156 },
  { name: 'កីឡា', icon: '⚽', slug: 'sports', count: 42 },
  { name: 'គ្រឿងសំអាង', icon: '💄', slug: 'beauty', count: 178 },
  { name: 'សៀវភៅ', icon: '📚', slug: 'books', count: 95 },
  { name: 'រថយន្ត', icon: '🚗', slug: 'auto', count: 67 },
];

const verifiedSellers = [
  { name: 'Phnom Penh Electronics', rating: 4.8, sales: '2.4K' },
  { name: 'Siem Reap Fashion Hub', rating: 4.9, sales: '1.8K' },
  { name: 'Kampong Cham Goods', rating: 4.7, sales: '1.2K' },
  { name: 'Battambang Premium', rating: 4.9, sales: '980' },
];

const HomePage = () => {
  const [topAds, setTopAds] = useState<any[]>([]);
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [loadingTopAds, setLoadingTopAds] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [verifiedSellersList, setVerifiedSellersList] = useState<any[]>([]);

  const getSafeString = (value: unknown) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return '';
  };

  const normalizeSeller = (seller: any) => {
    if (!seller || typeof seller !== 'object') return undefined;
    return {
      displayName:
        typeof seller.displayName === 'string'
          ? seller.displayName
          : typeof seller.name === 'string'
          ? seller.name
          : undefined,
      sellerVerificationStatus:
        typeof seller.sellerVerificationStatus === 'string'
          ? seller.sellerVerificationStatus
          : undefined,
    };
  };

  const normalizeProductCardProps = (product: any) => {
    const normalizedImage = getProductCoverImageUrl(product, product.imageUrl || '');

    return {
      id: product.slug || product._id,
      title: getSafeString(product.title),
      titleKh: getSafeString(product.titleKh),
      titleEn: getSafeString(product.titleEn),
      price: typeof product.price === 'string' || typeof product.price === 'number' ? product.price : '',
      location: getSafeString(product.location),
      category: getCategoryLabel(product.category, 'General'),
      imageUrl: getSafeString(normalizedImage),
      viewsCount: product.viewsCount,
      featured: product.featured,
      isFavorite: product.isFavorite,
      seller: normalizeSeller(product.seller),
    };
  };

  useEffect(() => {
    const loadTopAds = async () => {
      setLoadingTopAds(true);
      try {
        const { items } = await getFeaturedProducts({ page: '1', perPage: '12' });
        setTopAds(items || []);
      } catch (error) {
        setTopAds([]);
      } finally {
        setLoadingTopAds(false);
      }
    };

    const loadLatest = async () => {
      setLoadingLatest(true);
      try {
        const { items } = await getProducts({ page: '1', perPage: '12' });
        setLatestProducts(items || []);
      } catch (error) {
        setLatestProducts([]);
      } finally {
        setLoadingLatest(false);
      }
    };

    loadTopAds();
    loadLatest();
  }, []);

  return (
    <div className="bg-gradient-to-b from-background to-surface">
      <SEO
        title="Konpuk - ផ្សារលើអ៊ីនធឺណេតកម្ពុជា | Cambodia Marketplace"
        description="ស្វាគមន៍ទៅក្នុង Konpuk - ផ្សារលក់ឡើងវិញលើអ៊ីនធឺណេតសម្រាប់ម៉ាន់ចនិក្សកម្ពុជា។ ស្វាគមន៍ផលិតផល ផ្សារលក់ដាច់ស្បើយ ដើម្បីឱ្យងាយស្រួល | Find and sell local products across Cambodia with trusted sellers."
        url="https://konpuk.com/"
        image="/logo.png"
      />

      {/* Hero Section - Reduced height */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F766E] via-[#0F766E] to-teal-800 text-white">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.2) 35px, rgba(255,255,255,.2) 70px)'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="max-w-full sm:max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight whitespace-nowrap">
              ទិញ និង លក់ ទំនិញទូទាំងកម្ពុជា
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/95 leading-relaxed">
              ស្វែងរកផលិតផល និងអ្នកលក់ដែលអាចទុកចិត្តបានទូទាំងប្រទេស
            </p>

            <div className="mt-3">
              <div className="rounded-2xl bg-white p-3 sm:p-4 shadow-lg border border-muted">
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products - Moved up */}
      <section className="py-6 sm:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#0F766E] font-bold">ថ្មីបង្ហាញ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">ផលិតផលថ្មីបង្ហាញខ្លួន</h2>
            </div>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#0F766E] hover:text-[#0F766E]/80 transition"
            >
              មើលបន្ថែម
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingLatest ? (
            <div className="rounded-2xl border border-muted bg-background p-8 text-center text-text-secondary">
              កំពុងផ្ទុកផលិតផល…
            </div>
          ) : latestProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {latestProducts.map((product, index) => {
                const props = normalizeProductCardProps(product);

                console.log('LATEST CARD PROPS', {
                  index,
                  title: props.title,
                  imageUrl: props.imageUrl,
                  originalImages: product.images,
                });

                if (index === 0) {
                  (window as any).__HOME_FIRST_PRODUCT__ = {
                    title: product.title,
                    images: product.images,
                    imageUrl: product.imageUrl,
                  };
                }

                return <ProductCard key={product._id} {...props} />;
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-6 sm:py-8 bg-background border-b border-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[#0F766E] font-bold">ក្រុមផលិតផល</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">ស្វែងរកតាមក្រុម</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="rounded-2xl border border-muted bg-white p-4 text-center shadow-sm transition hover:shadow-md hover:border-[#0F766E]"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary leading-tight mb-1">{cat.name}</h3>
                <p className="text-xs text-text-secondary">{cat.count} ផលិតផល</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Sellers - Only if data exists */}
      {verifiedSellersList.length > 0 && (
        <section className="py-8 sm:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-wider text-[#F59E0B] font-bold">✅ បានផ្ទៀងផ្ទាត់</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">អ្នកលក់ដែលផ្ទៀងផ្ទាត់</h2>
              </div>
              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#0F766E] hover:text-[#0F766E]/80 transition"
              >
                មើលទាំងអស់
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {verifiedSellersList.map((seller, idx) => (
                <div key={idx} className="rounded-2xl border border-muted bg-gradient-to-br from-white to-background p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0F766E] to-[#F59E0B] flex items-center justify-center text-white font-bold">
                      {seller.displayName ? seller.displayName.charAt(0) : '?'}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
                      ⭐ {seller.rating || 4.8}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm mb-2 line-clamp-2">{seller.displayName || seller.name}</h3>
                  <p className="text-xs text-muted">{seller.salesCount || seller.sales || 0} ការលក់</p>
                  <button className="w-full mt-4 rounded-lg bg-[#0F766E]/10 px-3 py-2 text-xs font-semibold text-[#0F766E] hover:bg-[#0F766E]/20 transition">
                    មើលហាង
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products - Only if data exists */}
      {topAds.length > 0 && (
        <section className="py-6 sm:py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#F59E0B] font-bold">ផ្តើមលក់</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">ផលិតផលដែលផ្តើមលក់</h2>
              </div>
              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#0F766E] hover:text-[#0F766E]/80 transition"
              >
                មើលបន្ថែម
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingTopAds ? (
              <div className="rounded-2xl border border-muted bg-background p-8 text-center text-text-secondary">
                កំពុងផ្ទុក…
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topAds.map((product) => {
                  console.log('HOME PRODUCT', {
                    title: product.title,
                    images: product.images,
                    imageUrl: product.imageUrl,
                  });
                  const props = normalizeProductCardProps(product);

console.log('CARD PROPS', {
  title: props.title,
  imageUrl: props.imageUrl,
  originalImages: product.images,
});
                  return <ProductCard key={product._id} {...props} />;
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-[#0F766E] to-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to join Konpuk?</h2>
          <p className="text-lg max-w-2xl mx-auto text-white/90">Start buying and selling with Cambodia's most trusted community today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-bold text-[#0F766E] hover:bg-white/90 transition"
            >
              Sign up for free
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-full border border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


