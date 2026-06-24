import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { ArrowRight } from 'lucide-react';
import { getCategoryLabel } from '../../utils/category';
import { getProductCoverImageUrl } from '../../utils/product';

interface Product {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  titleKh?: string;
  titleEn?: string;
  price: number | string;
  location?: string;
  category?: { name?: string; labelKh?: string } | string;
  images?: Array<{ secureUrl?: string; url?: string }>;
  imageUrl?: string;
}

interface FeaturedSectionProps {
  title: string;
  description?: string;
  products: Product[];
  viewAllLink?: string;
}

const FeaturedSection = ({ title, description, products, viewAllLink = '/' }: FeaturedSectionProps) => {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight tracking-tight">{title}</h2>
            {description && <p className="mt-2 text-text-secondary">{description}</p>}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary-hover transition group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const id = product.slug || product._id || product.id || 'unknown';
            const categoryLabel = getCategoryLabel(product.category, 'General');
            const imageUrl = getProductCoverImageUrl(product, product.imageUrl || '');
            return (
              <ProductCard
                key={id}
                id={id}
                title={product.title}
                titleKh={product.titleKh}
                titleEn={product.titleEn}
                price={product.price}
                location={product.location || 'Unknown'}
                category={categoryLabel}
                imageUrl={imageUrl}
                viewsCount={(product as any).viewsCount}
                featured={(product as any).featured || (product as any).isFeatured}
                seller={(product as any).seller}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection;
