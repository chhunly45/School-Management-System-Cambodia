import api from './api';

export interface Vehicle {
  _id: string;
  vehicleCode: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  seatCapacity: number;
  fuelType: 'gasoline' | 'diesel';
  status: 'active' | 'maintenance' | 'out_of_service';
  notes?: string;
}

export interface VehiclePayload {
  vehicleCode: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  seatCapacity: number;
  fuelType: 'gasoline' | 'diesel';
  status: 'active' | 'maintenance' | 'out_of_service';
  notes?: string;
}

export interface VehicleListQuery {
  search?: string;
  fuelType?: 'gasoline' | 'diesel';
  status?: 'active' | 'maintenance' | 'out_of_service';
  page?: number;
  perPage?: number;
}

export interface VehicleListData {
  items: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const listVehicles = (query: VehicleListQuery = {}) =>
  api.get<ApiResponse<VehicleListData>>('/vehicles', { params: query }).then((r) => r.data);

export const getVehicle = (id: string) => api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`).then((r) => r.data);

export const createVehicle = (payload: VehiclePayload) =>
  api.post<ApiResponse<Vehicle>>('/vehicles', payload).then((r) => r.data);

export const updateVehicle = (id: string, payload: VehiclePayload) =>
  api.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload).then((r) => r.data);

export const deleteVehicle = (id: string) =>
  api.delete<ApiResponse<null>>(`/vehicles/${id}`).then((r) => r.data);