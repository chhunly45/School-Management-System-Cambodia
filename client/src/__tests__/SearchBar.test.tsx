import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchBar from '../components/marketplace/SearchBar';
import api from '../services/api';
import { getProvinces, getDistricts } from '../services/location.api';

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate
}));

jest.mock('../services/api');
jest.mock('../services/location.api', () => ({
  getProvinces: jest.fn(),
  getDistricts: jest.fn()
}));

const mockedApi = api as jest.Mocked<typeof api>;
const mockedGetProvinces = getProvinces as jest.MockedFunction<typeof getProvinces>;
const mockedGetDistricts = getDistricts as jest.MockedFunction<typeof getDistricts>;

describe('SearchBar', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
    mockedApi.get.mockResolvedValue({ data: { data: [{ _id: '1', name: 'Electronics' }] } });
    mockedGetProvinces.mockResolvedValue([{ id: 1, name: 'Phnom Penh' } as any]);
    mockedGetDistricts.mockResolvedValue([] as any);
  });

  it('renders search inputs and toggles advanced filters', async () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/ស្វែងរកផលិតផល/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ទីតាំង/i)).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /បង្ហាញតម្រងជម្រៅ/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/ប្រភេទ/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ខេត្ត/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/លក្ខខណ្ឌ/i)).toBeInTheDocument();
    });
  });

  it('allows advanced filter selection and input values', async () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /បង្ហាញតម្រងជម្រៅ/i });
    fireEvent.click(toggleButton);

    await waitFor(() => expect(screen.getByLabelText(/ប្រភេទ/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/ប្រភេទ/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/ខេត្ត/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/លក្ខខណ្ឌ/i), { target: { value: 'used' } });
    fireEvent.change(screen.getByLabelText(/ពេលដែលបានផុស/i), { target: { value: '7d' } });
    fireEvent.change(screen.getByPlaceholderText(/min/i), { target: { value: '100' } });
    fireEvent.change(screen.getByPlaceholderText(/max/i), { target: { value: '500' } });

    expect((screen.getByLabelText(/ប្រភេទ/i) as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText(/ខេត្ត/i) as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText(/លក្ខខណ្ឌ/i) as HTMLSelectElement).value).toBe('used');
    expect((screen.getByLabelText(/ពេលដែលបានផុស/i) as HTMLSelectElement).value).toBe('7d');
    expect((screen.getByPlaceholderText(/min/i) as HTMLInputElement).value).toBe('100');
    expect((screen.getByPlaceholderText(/max/i) as HTMLInputElement).value).toBe('500');
  });

  it('opens advanced filters when initial filters are provided', async () => {
    render(
      <MemoryRouter>
        <SearchBar
          initialFilters={{
            search: 'bike',
            location: 'Phnom Penh',
            category: '1',
            province: '1',
            condition: 'used',
            minPrice: '100',
            maxPrice: '500',
            datePosted: '7d'
          }}
        />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /លាក់តម្រងជម្រៅ/i })).toBeInTheDocument());
    expect((screen.getByLabelText(/ប្រភេទ/i) as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText(/ខេត្ត/i) as HTMLSelectElement).value).toBe('1');
    expect((screen.getByLabelText(/លក្ខខណ្ឌ/i) as HTMLSelectElement).value).toBe('used');
    expect((screen.getByLabelText(/ពេលដែលបានផុស/i) as HTMLSelectElement).value).toBe('7d');
  });

  it('handles category fetch failures gracefully', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Network fail'));

    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /បង្ហាញតម្រងជម្រៅ/i });
    fireEvent.click(toggleButton);

    await waitFor(() => expect(screen.getByLabelText(/ប្រភេទ/i)).toBeInTheDocument());
    expect((screen.getByLabelText(/ប្រភេទ/i) as HTMLSelectElement).children.length).toBeGreaterThanOrEqual(1);
  });

  it('submits advanced search filters and navigates with query params', async () => {
    render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/ស្វែងរកផលិតផល/i), { target: { value: 'phone' } });
    fireEvent.change(screen.getByPlaceholderText(/ទីតាំង/i), { target: { value: 'Kampot' } });

    fireEvent.click(screen.getByRole('button', { name: /បង្ហាញតម្រងជម្រៅ/i }));
    await waitFor(() => expect(screen.getByLabelText(/ប្រភេទ/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/ប្រភេទ/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/ខេត្ត/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/លក្ខខណ្ឌ/i), { target: { value: 'used' } });
    fireEvent.change(screen.getByLabelText(/ពេលដែលបានផុស/i), { target: { value: '30d' } });
    fireEvent.change(screen.getByPlaceholderText(/min/i), { target: { value: '100' } });
    fireEvent.change(screen.getByPlaceholderText(/max/i), { target: { value: '500' } });

    fireEvent.click(screen.getByRole('button', { name: /ស្វែងរក/i }));

    expect(mockedNavigate).toHaveBeenCalledWith(
      '/products?search=phone&location=Kampot&category=1&province=1&condition=used&minPrice=100&maxPrice=500&datePosted=30d'
    );
  });
});
