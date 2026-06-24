import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/marketplace/ProductCard';
import { getProductCoverImageUrl } from '../utils/product';
import { getFavorites, removeFavorite } from '../services/favorites.api';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getFavorites();
        setFavorites(data || []);
      } catch (err) {
        setError('Unable to load your favorites. Please login or try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await removeFavorite(productId);
      setFavorites((current) => current.filter((product) => product._id !== productId));
    } catch (err) {
      console.error('Remove favorite error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        <div className="rounded-3xl border border-muted bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-primary">My Favorites</p>
              <h1 className="text-3xl font-bold text-text-primary">Saved products</h1>
              <p className="mt-2 text-sm text-text-secondary">Keep an eye on listings you're interested in and revisit them later.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Heart className="w-5 h-5" />
              {favorites.length} saved item{favorites.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-muted bg-white p-8 text-center text-text-secondary">Loading your favorites…</div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
        ) : favorites.length === 0 ? (
          <div className="rounded-3xl border border-muted bg-white p-8 text-center text-text-secondary">
            You haven't saved any products yet. Browse listings and tap the heart icon to add them to your wishlist.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((product) => (
              <div key={product._id} className="group relative rounded-2xl border border-muted bg-white shadow-sm transition hover:shadow-xl hover:border-primary/30">
                <button
                  type="button"
                  onClick={() => handleRemove(product._id)}
                  className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-red-500 shadow-sm transition hover:bg-white"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <ProductCard
                  id={product.slug || product._id}
                  title={product.title}
                  titleKh={product.titleKh}
                  titleEn={product.titleEn}
                  price={product.price}
                  location={product.location}
                  category={product.category?.labelKh || product.category?.name}
                  imageUrl={getProductCoverImageUrl(product, product.imageUrl || '')}
                  featured={product.featured || product.isFeatured}
                  seller={product.seller}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;

