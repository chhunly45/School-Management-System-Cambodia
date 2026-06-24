import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CategoriesGrid from '../components/marketplace/CategoriesGrid';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

jest.mock('../services/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('CategoriesGrid', () => {
  afterEach(() => {
    mockedApi.get.mockReset();
  });

  test('shows loading state initially', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading categories/i)).toBeInTheDocument();
  });

  test('renders categories when API returns data', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ _id: '1', name: 'Electronics' }, { _id: '2', name: 'Books' }] } } as any);
    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );
    expect(await screen.findByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  test('handles API error and shows empty/loading block', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('network'));
    render(
      <MemoryRouter>
        <CategoriesGrid />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Loading categories/i)).toBeInTheDocument());
  });
});
