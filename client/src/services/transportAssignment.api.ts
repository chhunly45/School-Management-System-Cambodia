import api from './api';

type VehicleRef = string | { _id: string; vehicleCode: string; plateNumber: string; brand: string; model: string; status: string };
type RouteRef = string | { _id: string; routeCode: string; routeName: string; status: string };

export interface TransportAssignment {
  _id: string;
  assignmentDate: string;
  vehicleId: VehicleRef;
  vehicleCode?: string;
  routeId: RouteRef;
  routeCode?: string;
  driverEmployeeCode: string;
  driverName: string;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TransportAssignmentPayload {
  assignmentDate: string;
  vehicleId: string;
  routeId: string;
  driverEmployeeCode: string;
  driverName?: string;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TransportAssignmentListQuery {
  search?: string;
  status?: 'scheduled' | 'running' | 'completed' | 'cancelled';
  assignmentDate?: string;
  page?: number;
  perPage?: number;
}

export interface TransportAssignmentListData {
  items: TransportAssignment[];
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

export const listTransportAssignments = (query: TransportAssignmentListQuery = {}) =>
  api.get<ApiResponse<TransportAssignmentListData>>('/transport-assignments', { params: query }).then((r) => r.data);

export const getTransportAssignment = (id: string) =>
  api.get<ApiResponse<TransportAssignment>>(`/transport-assignments/${id}`).then((r) => r.data);

export const createTransportAssignment = (payload: TransportAssignmentPayload) =>
  api.post<ApiResponse<TransportAssignment>>('/transport-assignments', payload).then((r) => r.data);

export const updateTransportAssignment = (id: string, payload: TransportAssignmentPayload) =>
  api.put<ApiResponse<TransportAssignment>>(`/transport-assignments/${id}`, payload).then((r) => r.data);

export const deleteTransportAssignment = (id: string) =>
  api.delete<ApiResponse<null>>(`/transport-assignments/${id}`).then((r) => r.data);