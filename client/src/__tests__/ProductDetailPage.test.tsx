import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProductDetailPage from '../pages/ProductDetailPage';
import * as productApi from '../services/product.api';
import * as favoritesApi from '../services/favorites.api';
import * as authApi from '../services/auth.api';
import { useAuth } from '../hooks/useAuth';

jest.mock('../services/product.api', () => ({
  __esModule: true,
  getProductById: jest.fn(),
  getProductBySlug: jest.fn(),
  getProducts: jest.fn(),
  trackProductView: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  getFeaturedProducts: jest.fn()
}));
jest.mock('../services/favorites.api', () => ({
  __esModule: true,
  checkFavorite: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  getFavoritesCount: jest.fn()
}));
jest.mock('../services/auth.api', () => ({
  __esModule: true,
  getProfile: jest.fn()
}));
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const mockedProductApi = productApi as jest.Mocked<typeof productApi>;
const mockedFavoritesApi = favoritesApi as jest.Mocked<typeof favoritesApi>;
const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProductDetailPage', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      authToken: null,
      isAuthenticated: false,
      register: jest.fn() as any,
      login: jest.fn() as any,
      verifyLoginOtp: jest.fn() as any,
      logout: jest.fn() as any,
      setUser: jest.fn() as any
    });

    mockedFavoritesApi.checkFavorite.mockResolvedValue(false);
    mockedAuthApi.getProfile.mockResolvedValue(null);
  });

  it('loads and renders product details', async () => {
    mockedProductApi.getProductBySlug.mockResolvedValue({
      _id: '123',
      title: 'Detailed Product',
      description: 'A detailed product description',
      price: 2500,
      location: 'Phnom Penh',
      condition: 'new',
      category: { name: 'Electronics' },
      images: [{ _id: 'img1', secureUrl: 'https://example.com/image.png', altText: 'Product image' }],
      seller: { displayName: 'Seller One', profileImageUrl: '', location: 'Phnom Penh' },
      status: 'published'
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/products/123']}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(mockedProductApi.getProductBySlug).toHaveBeenCalledWith('123'));
    expect(mockedFavoritesApi.checkFavorite).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Detailed Product/i })).toBeInTheDocument();
    expect(screen.getByText(/A detailed product description/i)).toBeInTheDocument();
    expect(screen.getByText(/Seller One/i)).toBeInTheDocument();
  });

  it('renders fallback content when no product images are available', async () => {
    mockedProductApi.getProductBySlug.mockResolvedValue({
      _id: '456',
      title: 'No Image Product',
      description: 'Product without images',
      price: 1500,
      location: 'Battambang',
      condition: 'used',
      category: { name: 'Electronics' },
      images: [],
      seller: { displayName: 'NoPic Seller', profileImageUrl: '', location: 'Battambang' },
      status: 'draft'
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/products/456']}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(mockedProductApi.getProductBySlug).toHaveBeenCalledWith('456'));
    expect(screen.queryByRole('img', { name: /Product image/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Gallery/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /No Image Product/i })).toBeInTheDocument();
  });

  it('shows an error message when product load fails', async () => {
    mockedProductApi.getProductBySlug.mockRejectedValue(new Error('Network failure'));

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/products/999']}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(screen.getByText(/Unable to load product/i)).toBeInTheDocument());
  });

  it('calls checkFavorite when authenticated and skips it for guests', async () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: 'user-1', email: 'user@example.com', displayName: 'Test User' },
      authToken: 'token-123',
      isAuthenticated: true,
      register: jest.fn() as any,
      login: jest.fn() as any,
      verifyLoginOtp: jest.fn() as any,
      logout: jest.fn() as any,
      setUser: jest.fn() as any
    });

    mockedProductApi.getProductBySlug.mockResolvedValue({
      _id: '321',
      title: 'Authenticated Product',
      description: 'Product visible to authenticated users',
      price: 2000,
      location: 'Siem Reap',
      condition: 'new',
      category: { name: 'Electronics' },
      images: [{ _id: 'img1', secureUrl: 'https://example.com/auth-image.png', altText: 'Auth product image' }],
      seller: { displayName: 'Seller Auth', profileImageUrl: '', location: 'Siem Reap' },
      status: 'published'
    });
    mockedFavoritesApi.checkFavorite.mockResolvedValueOnce(true);

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/products/321']}>
          <Routes>
            <Route path="/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => expect(mockedFavoritesApi.checkFavorite).toHaveBeenCalledWith('321'));
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
  });
});
