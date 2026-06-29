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

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-muted bg-white p-8 shadow-sm sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0F766E]">Marketplace freeze</p>
            <h1 className="mt-4 text-3xl font-semibold text-text-primary sm:text-4xl">
              The marketplace experience is temporarily unavailable.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-text-secondary sm:text-lg">
              Marketplace browsing, posting, and related entry points are currently hidden while the platform remains under maintenance.
            </p>
            <div className="mt-8 rounded-3xl border border-muted bg-background p-6 text-sm text-text-secondary">
              School management features and account tools remain available while this UI freeze is in place.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


