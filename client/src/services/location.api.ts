import api from './api';

export interface Province {
  id?: number | string;
  _id?: string;
  name: string;
  nameKh?: string;
  districts?: District[];
}

export interface District {
  id: number;
  name: string;
  nameKh: string;
}

export const getProvinces = async (): Promise<Province[]> => {
  const response = await api.get('/locations/provinces');
  return response.data.data;
};

export const getDistricts = async (provinceId: number | string): Promise<District[]> => {
  const response = await api.get(`/locations/provinces/${provinceId}/districts`);
  return response.data.data;
};
