import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getViteEnv } from '../utils/viteEnv';

const defaultSiteUrl = getViteEnv('VITE_SITE_URL', 'https://konpuk.com');
const defaultImage = `${defaultSiteUrl}/logo.png`;

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({ title, description, url, image, type = 'website', structuredData, robots = 'index, follow' }) => {
  const pageTitle = title ? `${title} | Konpuk` : 'Konpuk';
  const metaDescription = description || 'Cambodian marketplace for buyers and sellers.';
  const metaImage = image || defaultImage;
  const metaUrl = url || (typeof window !== 'undefined' ? window.location.href : defaultSiteUrl);
  const structuredJson = structuredData || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Konpuk',
    url: defaultSiteUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Konpuk'
    }
  };

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content="Cambodia marketplace, buy sell, local classifieds, Khmer products" />
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="Konpuk" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:url" content={metaUrl} />

      <link rel="canonical" href={metaUrl} />

      {structuredJson && (
        <script type="application/ld+json" data-seo>{JSON.stringify(structuredJson)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
