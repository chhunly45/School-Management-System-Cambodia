import api from './api';

export interface RouteItem {
  _id: string;
  routeCode: string;
  routeName: string;
  pickupAreas: string[];
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface RoutePayload {
  routeCode: string;
  routeName: string;
  pickupAreas: string[];
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface RouteListQuery {
  search?: string;
  status?: 'active' | 'inactive';
  page?: number;
  perPage?: number;
}

export interface RouteListData {
  items: RouteItem[];
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

export const listRoutes = (query: RouteListQuery = {}) =>
  api.get<ApiResponse<RouteListData>>('/routes', { params: query }).then((r) => r.data);

export const getRoute = (id: string) => api.get<ApiResponse<RouteItem>>(`/routes/${id}`).then((r) => r.data);

export const createRoute = (payload: RoutePayload) =>
  api.post<ApiResponse<RouteItem>>('/routes', payload).then((r) => r.data);

export const updateRoute = (id: string, payload: RoutePayload) =>
  api.put<ApiResponse<RouteItem>>(`/routes/${id}`, payload).then((r) => r.data);

export const deleteRoute = (id: string) =>
  api.delete<ApiResponse<null>>(`/routes/${id}`).then((r) => r.data);