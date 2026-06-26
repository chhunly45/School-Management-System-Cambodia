import api from './api';

type VehicleRef = string | { _id: string; vehicleCode: string; plateNumber: string; brand: string; model: string; fuelType: string; status: string };
type AssignmentRef = string | { _id: string; assignmentDate: string; vehicleCode?: string; routeCode?: string; driverEmployeeCode: string; driverName: string; status: string };

export interface FuelRecord {
  _id: string;
  vehicleId: VehicleRef;
  vehicleCode?: string;
  transportAssignmentId?: AssignmentRef | null;
  assignmentDate: string;
  odometer: number;
  fuelType: 'gasoline' | 'diesel';
  liters: number;
  pricePerLiter: number;
  currency: string;
  totalCost: number;
  fuelStation: string;
  receiptNumber?: string;
  notes?: string;
}

export interface FuelRecordPayload {
  vehicleId: string;
  transportAssignmentId?: string;
  assignmentDate: string;
  odometer: number;
  fuelType: 'gasoline' | 'diesel';
  liters: number;
  pricePerLiter: number;
  currency: string;
  totalCost?: number;
  fuelStation: string;
  receiptNumber?: string;
  notes?: string;
}

export interface FuelRecordListQuery {
  search?: string;
  vehicleId?: string;
  fuelType?: 'gasoline' | 'diesel';
  currency?: string;
  assignmentDate?: string;
  page?: number;
  perPage?: number;
}

export interface FuelRecordListData {
  items: FuelRecord[];
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

export const listFuelRecords = (query: FuelRecordListQuery = {}) =>
  api.get<ApiResponse<FuelRecordListData>>('/fuel-records', { params: query }).then((r) => r.data);

export const getFuelRecord = (id: string) =>
  api.get<ApiResponse<FuelRecord>>(`/fuel-records/${id}`).then((r) => r.data);

export const createFuelRecord = (payload: FuelRecordPayload) =>
  api.post<ApiResponse<FuelRecord>>('/fuel-records', payload).then((r) => r.data);

export const updateFuelRecord = (id: string, payload: FuelRecordPayload) =>
  api.put<ApiResponse<FuelRecord>>(`/fuel-records/${id}`, payload).then((r) => r.data);

export const deleteFuelRecord = (id: string) =>
  api.delete<ApiResponse<null>>(`/fuel-records/${id}`).then((r) => r.data);