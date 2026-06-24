import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../components/marketplace/ProductCard';

describe('ProductCard', () => {
  it('renders the product card with title, price, and category', () => {
    render(
      <MemoryRouter>
        <ProductCard id="123" titleEn="Test Product" price="KHR 500,000" location="Phnom Penh" category="Electronics" />
      </MemoryRouter>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/KHR\s*500,000/)).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/123');
  });

  it('renders bilingual title when both titleKh and titleEn are provided', () => {
    render(
      <MemoryRouter>
        <ProductCard id="456" titleKh="ផលិតផល" titleEn="Product" price={1000} location="Phnom Penh" category="General" />
      </MemoryRouter>
    );

    expect(screen.getByText('ផលិតផល')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
  });

  it('renders without a visible title when no title is provided', () => {
    render(
      <MemoryRouter>
        <ProductCard id="789" price={500} location="Phnom Penh" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/789');
    expect(screen.queryByText('Product')).not.toBeInTheDocument();
  });
});
