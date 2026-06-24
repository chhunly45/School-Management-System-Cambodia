import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import { getProvinces, getDistricts } from '../services/location.api';
import HomePage from '../pages/HomePage';

jest.mock('../services/api');
jest.mock('../services/location.api', () => ({
  getProvinces: jest.fn(),
  getDistricts: jest.fn()
}));
const mockedApi = api as jest.Mocked<typeof api>;
const mockedGetProvinces = getProvinces as jest.MockedFunction<typeof getProvinces>;
const mockedGetDistricts = getDistricts as jest.MockedFunction<typeof getDistricts>;

describe('HomePage', () => {
  beforeEach(() => {
    mockedApi.get.mockResolvedValue({ data: { data: [{ _id: '1', name: 'Electronics' }] } });
    mockedGetProvinces.mockResolvedValue([{ id: 1, name: 'Phnom Penh' }] as any);
    mockedGetDistricts.mockResolvedValue([] as any);
  });

  it('renders the homepage hero and search bar', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/ទិញ និង លក់/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ស្វែងរក/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/categories');
    });
  });
});
