import { Link } from 'react-router-dom';
import { useEffect, useState, MouseEvent } from 'react';
import { MapPin, Heart, Eye } from 'lucide-react';
import { formatViewsCount } from '../../utils/views';
import { formatPriceKHR, formatPriceUSD } from '../../utils/price';
import { getCategoryLabel } from '../../utils/category';

interface ProductCardProps {
  title?: string;
  titleKh?: string;
  titleEn?: string;
  price: string | number;
  location?: string;
  category?: string | { name?: string; labelKh?: string };
  id: string;
  imageUrl?: string;
  viewsCount?: number;
  featured?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string, currentlyFavorite: boolean) => void;
  seller?: { displayName?: string; sellerVerificationStatus?: string };
}

const ProductCard = ({ title, titleKh, titleEn, price, location, category, id, imageUrl, viewsCount = 0, featured = false, isFavorite = false, onToggleFavorite, seller }: ProductCardProps) => {
  const [isSaved, setIsSaved] = useState<boolean>(isFavorite);

  const categoryLabel = getCategoryLabel(category, '');

  // Khmer-first title logic
  const displayTitle = titleKh || titleEn || title || 'Product';
  const altText = displayTitle;

  useEffect(() => {
    setIsSaved(Boolean(isFavorite));
  }, [isFavorite]);

  const fallback = '/no-image.png';
  console.log('IMAGE SRC:', imageUrl);
  const src = imageUrl || fallback;

  const formatPrice = (p: string | number): { usd: string; khr: string } => ({
    usd: formatPriceUSD(p),
    khr: formatPriceKHR(p)
  });

  const priceText = formatPrice(price);
  const sellerVerified = seller?.sellerVerificationStatus === 'verified';

  return (
    <Link
      to={`/products/${id}`}
      className="group block overflow-hidden rounded-2xl border border-surface-muted bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
          <div className="relative overflow-hidden bg-surface">
        <div className="w-full bg-gray-100 aspect-[16/9] sm:aspect-[4/3]">
          <img
            src={src}
            alt={altText}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 rounded-t-2xl"
            onLoad={() => {
              console.log('IMAGE LOADED:', src);
            }}
            onError={(e) => {
              console.log('IMAGE FAILED:', src);
              e.currentTarget.src = fallback;
            }}
          />
        </div>

        {categoryLabel && (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-xs font-medium text-text-primary shadow-sm">
            {categoryLabel}
          </span>
        )}

        {featured && (
          <span className="absolute right-3 top-3 rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white shadow">
            Featured
          </span>
        )}

        <button
          type="button"
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const nextValue = !isSaved;
            setIsSaved(nextValue);
            if (onToggleFavorite) {
              onToggleFavorite(id, isSaved);
            }
          }}
          className="absolute right-3 bottom-3 inline-flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-white shadow-md transition hover:shadow-lg hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart className={`w-5 h-5 transition ${isSaved ? 'text-red-500 fill-current' : 'text-muted'}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex flex-col h-40">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary leading-[1.5] mb-1 line-clamp-1 break-words overflow-hidden">
            {titleKh || title || titleEn}
          </h3>

          {titleKh && titleEn && titleEn !== titleKh ? (
            <p className="text-xs sm:text-sm text-text-secondary line-clamp-1 truncate">{titleEn}</p>
          ) : null}

          {location && (
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between">
            <div>
            <p className="text-lg font-extrabold text-[#0F766E]" aria-label={`Price ${priceText.usd} ${priceText.khr}`}>{priceText.usd}</p>
            <p className="text-xs text-text-secondary" aria-hidden="true">{priceText.khr}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {seller?.sellerVerificationStatus && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${sellerVerified ? 'bg-primary/15 text-primary font-bold' : 'bg-muted/20 text-text-secondary'}`} title={sellerVerified ? 'Verified seller' : 'Not verified'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>{sellerVerified ? 'ផ្ទៀងផ្ទាត់' : 'មិនផ្ទៀងផ្ទាត់'}</span>
                </span>
            )}

            <span className="text-xs text-text-secondary">{formatViewsCount(viewsCount)} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;


