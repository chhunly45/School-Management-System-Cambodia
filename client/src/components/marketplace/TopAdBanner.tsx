import React, { useEffect, useState } from 'react';
import { getActiveBanners } from '../../services/banner.api';

interface TopAdBannerProps {
  imageUrl?: string;
  link?: string;
}

const TopAdBanner = ({ imageUrl, link }: TopAdBannerProps) => {
  const [banner, setBanner] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    getActiveBanners('top')
      .then((res) => {
        if (!mounted) return;
        const items = res.data || [];
        setBanner(items.length ? items[0] : null);
      })
      .catch(() => {
        // ignore and keep placeholder
      });
    return () => {
      mounted = false;
    };
  }, []);

  const display = banner
    ? (
      <div className="rounded-2xl overflow-hidden border border-muted bg-white shadow-sm">
        <div className="flex items-center gap-4 p-4 sm:p-6">
          <div className="flex-shrink-0">
            {banner.imageUrl ? (
              <img src={banner.imageUrl} alt={banner.title} className="hidden md:block w-48 h-20 object-cover rounded-md" />
            ) : (
              <div className="hidden md:flex w-48 h-20 bg-background rounded-md items-center justify-center text-muted">Ad image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">{banner.title}</h3>
            <p className="text-sm text-text-secondary truncate">{banner.subtitle}</p>
          </div>

          <div className="flex-shrink-0">
            <a
              href={banner.linkUrl || link || '/contact'}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition text-sm"
              aria-label="Contact us about advertising"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    )
    : (
      <div className="rounded-2xl overflow-hidden border border-muted bg-white shadow-sm">
        <div className="flex items-center gap-4 p-4 sm:p-6">
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt="ad" className="hidden md:block w-48 h-20 object-cover rounded-md" />
            ) : (
              <div className="hidden md:flex w-48 h-20 bg-background rounded-md items-center justify-center text-muted">Ad image</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">Advertise with Konpuk</h3>
            <p className="text-sm text-text-secondary truncate">Promote your products to thousands of local buyers</p>
          </div>

          <div className="flex-shrink-0">
            <a
              href={link || '/contact'}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-hover transition text-sm"
              aria-label="Contact us about advertising"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {display}
    </section>
  );
};

export default TopAdBanner;

