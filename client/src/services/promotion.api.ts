import api from './api';

export interface PromotionPlan {
  id: string;
  label: string;
  durationDays: number;
  price: number;
  currency: string;
}

export interface PromotionRecord {
  _id: string;
  product: {
    _id: string;
    title: string;
    slug?: string;
    status?: string;
  };
  seller?: {
    displayName: string;
    email: string;
  };
  plan: string;
  durationDays: number;
  price: number;
  currency: string;
  status: string;
  purchaseDate: string;
  startDate?: string | null;
  endDate?: string | null;
  rejectionReason?: string;
}

export interface PromotionMetrics {
  activePromotions: number;
  expiredPromotions: number;
  revenueFromPromotions: number;
}

export const getPromotionPlans = async (): Promise<PromotionPlan[]> => {
  const response = await api.get('/promotions/plans');
  return response.data.data;
};

export const purchasePromotion = async (productId: string, planId: string) => {
  const response = await api.post('/promotions/purchase', { productId, planId });
  return response.data.data;
};

export const getSellerPromotions = async (): Promise<PromotionRecord[]> => {
  const response = await api.get('/promotions');
  return response.data.data;
};

export const getAdminPromotions = async (params: Record<string, any> = {}) => {
  const response = await api.get('/admin/promotions', { params });
  return response.data.data;
};

export const getAdminPromotionMetrics = async (): Promise<PromotionMetrics> => {
  const response = await api.get('/admin/promotions/metrics');
  return response.data.data;
};

export const approvePromotion = async (promotionId: string) => {
  const response = await api.patch(`/admin/promotions/${promotionId}/approve`);
  return response.data.data;
};

export const rejectPromotion = async (promotionId: string, reason: string) => {
  const response = await api.patch(`/admin/promotions/${promotionId}/reject`, { reason });
  return response.data.data;
};

export const extendPromotion = async (promotionId: string, extraDays: number) => {
  const response = await api.patch(`/admin/promotions/${promotionId}/extend`, { extraDays });
  return response.data.data;
};

export const cancelPromotion = async (promotionId: string) => {
  const response = await api.patch(`/admin/promotions/${promotionId}/cancel`);
  return response.data.data;
};
