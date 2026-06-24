import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { getProvinces, getDistricts, Province, District } from '../../services/location.api';

interface SearchBarProps {
  initialFilters?: {
    search?: string;
    location?: string;
    category?: string;
    province?: string;
    district?: string;
    condition?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    datePosted?: string;
  };
}

const SearchBar = ({ initialFilters }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '');
  const [location, setLocation] = useState(initialFilters?.location || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [province, setProvince] = useState(initialFilters?.province || '');
  const [district, setDistrict] = useState(initialFilters?.district || '');
  const [condition, setCondition] = useState(initialFilters?.condition || '');
  const [sort, setSort] = useState(initialFilters?.sort || '');
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || '');
  const [datePosted, setDatePosted] = useState(initialFilters?.datePosted || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  interface CategoryItem { _id: string; name: string; labelKh?: string }
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const sortOptions = [
    { value: 'newest', label: 'ថ្មីជាាច្រើន' },
    { value: 'priceAsc', label: 'ថ្លៃពីទាបទៅខ្ពស់' },
    { value: 'priceDesc', label: 'ថ្លៃពីខ្ពស់ទៅទាប' }
  ];
  const navigate = useNavigate();

  useEffect(() => {
    setSearchTerm(initialFilters?.search || '');
    setLocation(initialFilters?.location || '');
    setCategory(initialFilters?.category || '');
    setProvince(initialFilters?.province || '');
    setDistrict(initialFilters?.district || '');
    setCondition(initialFilters?.condition || '');
    setSort(initialFilters?.sort || '');
    setMinPrice(initialFilters?.minPrice || '');
    setMaxPrice(initialFilters?.maxPrice || '');
    setDatePosted(initialFilters?.datePosted || '');

    const hasFilters = initialFilters
      ? Object.values(initialFilters).some((value) => Boolean(value))
      : false;
    setShowAdvanced(hasFilters);
  }, [initialFilters]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (error) {
        setCategories([]);
      }
    };

    const fetchProvinces = async () => {
      try {
        const provincesData = await getProvinces();
        setProvinces(provincesData);
        if (initialFilters?.province) {
          try {
            const districtsData = await getDistricts(initialFilters.province);
            setDistricts(districtsData);
          } catch (error) {
            console.error('Failed to load districts:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load provinces:', error);
      }
    };

    fetchCategories();
    fetchProvinces();
  }, []);

  useEffect(() => {
    const loadDistrictsForProvince = async () => {
      if (province) {
        try {
          const districtsData = await getDistricts(province);
          setDistricts(districtsData);
        } catch (error) {
          console.error('Failed to load districts:', error);
        }
      } else {
        setDistricts([]);
      }
      setDistrict('');
    };

    loadDistrictsForProvince();
  }, [province]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (searchTerm) params.append('search', searchTerm);
    if (location) params.append('location', location);
    if (category) params.append('category', category);
    if (province) params.append('province', province);
    if (district) params.append('district', district);
    if (condition) params.append('condition', condition);
    if (sort) params.append('sort', sort);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (datePosted) params.append('datePosted', datePosted);

    const queryString = params.toString();
    navigate(queryString ? `/products?${queryString}` : '/products');
  };

  return (
    <form onSubmit={handleSearch} className="w-full space-y-3" aria-labelledby="search-form-heading">
      <h2 id="search-form-heading" className="sr-only">Search products</h2>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <label htmlFor="search-input" className="sr-only">ស្វែងរកផលិតផល</label>
          <input
            id="search-input"
            name="search"
            type="text"
            placeholder="ស្វែងរកផលិតផល..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-muted bg-white text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition focus-visible:ring-2"
            aria-label="ស្វែងរកផលិតផល"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <label htmlFor="location-input" className="sr-only">ទីតាំង</label>
          <input
            id="location-input"
            name="location"
            type="text"
            placeholder="ទីតាំង"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-muted bg-white text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition focus-visible:ring-2"
            aria-label="ទីតាំង"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#0F766E] text-white font-semibold hover:bg-[#0f6f63] transition duration-200 shadow"
        >
          ស្វែងរក
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary"
        aria-expanded={showAdvanced}
        aria-controls="advanced-filters"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showAdvanced ? 'លាក់តម្រងជម្រៅ' : 'បង្ហាញតម្រងជម្រៅ'}
      </button>

      {showAdvanced && (
        <div id="advanced-filters" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Advanced search filters">
          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">ប្រភេទ</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">គ្រប់ប្រភេទ</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.labelKh || cat.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">ខេត្ត</span>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">គ្រប់ខេត្ត</option>
              {provinces.map((prov) => {
                const provinceValue = prov.id ?? prov._id;
                return (
                  <option key={provinceValue} value={provinceValue}>
                    {prov.name}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">ស្រុក / ខណ្ឌ</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!province}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">គ្រប់ស្រុក</option>
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">លក្ខខណ្ឌ</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">គ្រប់លក្ខខណ្ឌ</option>
              <option value="new">ថ្មី</option>
              <option value="used">ប្រើរួច</option>
              <option value="refurbished">បានស្ដារឡើងវិញ</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">ដាក់តម្រៀប</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">តម្រៀបលំនាំដើម</option>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-text-secondary">ពេលដែលបានផុស</span>
            <select
              value={datePosted}
              onChange={(e) => setDatePosted(e.target.value)}
              className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">គ្រប់ពេល</option>
              <option value="24h">24 ម៉ោងចុងក្រោយ</option>
              <option value="7d">7 ថ្ងៃចុងក្រោយ</option>
              <option value="30d">30 ថ្ងៃចុងក្រោយ</option>
              <option value="90d">90 ថ្ងៃចុងក្រោយ</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-text-secondary">តម្លៃ​ ទាបបំផុត</span>
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Min"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-text-secondary">តម្លៃ​ ខ្ពស់បំផុត</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-muted bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Max"
              />
            </label>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchBar;

