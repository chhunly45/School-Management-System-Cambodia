// @ts-nocheck
// The project setup globally mocks `services/location.api` in setupTests.ts to avoid XHRs.
// For these unit tests we need the real module so unmock it, then mock `services/api`.
jest.unmock('../services/location.api');

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

const locationApi = require('../services/location.api');
const api = require('../services/api').default;

describe('location.api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getProvinces returns data from api', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ name: 'Phnom Penh' }] } });
    const provinces = await locationApi.getProvinces();
    expect(provinces).toEqual([{ name: 'Phnom Penh' }]);
    expect(api.get).toHaveBeenCalledWith('/locations/provinces');
  });

  it('getDistricts returns districts for a province', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'District 1', nameKh: 'ផ្សេង' }] } });
    const districts = await locationApi.getDistricts(1);
    expect(districts).toEqual([{ id: 1, name: 'District 1', nameKh: 'ផ្សេង' }]);
    expect(api.get).toHaveBeenCalledWith('/locations/provinces/1/districts');
  });
});
