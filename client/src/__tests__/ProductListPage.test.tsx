import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductListPage from '../pages/ProductListPage';
import * as productApi from '../services/product.api';

jest.mock('../services/product.api');
const mockedProductApi = productApi as jest.Mocked<typeof productApi>;

describe('ProductListPage', () => {
  it('renders products from the API response', async () => {
    mockedProductApi.getProducts.mockResolvedValue({
      items: [
        { _id: '123', title: 'Test Bike', price: 1200, location: 'Phnom Penh', category: { name: 'Sport' } }
      ],
      meta: { total: 1 }
    });

    render(
      <MemoryRouter initialEntries={['/products?search=bike']}>
        <ProductListPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockedProductApi.getProducts).toHaveBeenCalled());
    expect(screen.getByText(/Test Bike/i)).toBeInTheDocument();
    expect(screen.getByText(/បង្ហាញ 1 នៃ 1 លទ្ធផល/i)).toBeInTheDocument();
  });

  it('shows an error message when product loading fails', async () => {
    mockedProductApi.getProducts.mockRejectedValueOnce(new Error('Server error'));

    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductListPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Unable to load products\. Please try again later\./i)).toBeInTheDocument());
  });

  it('shows no products found when the API returns an empty list', async () => {
    mockedProductApi.getProducts.mockResolvedValueOnce({ items: [], meta: { total: 0 } });

    render(
      <MemoryRouter initialEntries={['/products']}>
        <ProductListPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/No products found\. Try adjusting your filters\./i)).toBeInTheDocument());
  });
});
