import { HelmetProvider } from 'react-helmet-async';
import { render, waitFor } from '@testing-library/react';
import SEO from '../components/SEO';

describe('SEO component', () => {
  it('updates document head metadata', async () => {
    render(
      <HelmetProvider>
        <SEO
          title="Test Page"
          description="A test description"
          url="https://konpuk.com/test"
          image="https://konpuk.com/test-image.png"
          type="website"
        />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')).toBeInTheDocument();
    });

    expect(document.title).toBe('Test Page | Konpuk');
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'A test description');
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Test Page | Konpuk');
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'https://konpuk.com/test');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    expect(document.querySelector('meta[name="twitter:url"]')).toHaveAttribute('content', 'https://konpuk.com/test');
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://konpuk.com/test');
  });

  it('supports custom robots directives', async () => {
    render(
      <HelmetProvider>
        <SEO title="Noindex Page" robots="noindex" url="https://konpuk.com/noindex" />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('meta[name="robots"]')).toBeInTheDocument();
    });

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'https://konpuk.com/noindex');
  });

  it('uses default metadata and structured data when no props are provided', async () => {
    render(
      <HelmetProvider>
        <SEO />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')).toBeInTheDocument();
    });

    expect(document.title).toBe('Konpuk');
    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    expect(document.querySelector('script[type="application/ld+json"][data-seo]')).toBeInTheDocument();

    const script = document.querySelector('script[type="application/ld+json"][data-seo]');
    expect(script).not.toBeNull();
    const json = script ? JSON.parse(script.textContent || '{}') : {};
    expect(json['@type']).toBe('WebSite');
    expect(json.publisher?.name).toBe('Konpuk');
  });

  it('inserts custom structured data when provided', async () => {
    const customData = { '@context': 'https://schema.org', '@type': 'Product', name: 'Custom Product' };
    render(
      <HelmetProvider>
        <SEO title="Custom" structuredData={customData} />
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('script[type="application/ld+json"][data-seo]')).toBeInTheDocument();
    });

    const script = document.querySelector('script[type="application/ld+json"][data-seo]');
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('Custom Product');
  });
});
