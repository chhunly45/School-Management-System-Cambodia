import api from './api';

export interface ReviewPayload {
  seller: string;
  product?: string;
  rating: number;
  comment?: string;
}

export interface ReviewItem {
  _id: string;
  seller: string;
  reviewer: {
    _id: string;
    displayName: string;
    avatar?: string;
    profileImageUrl?: string;
  };
  product?: {
    _id: string;
    title: string;
    slug?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
}

export interface SellerReviewsResponse {
  items: ReviewItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  summary: ReviewSummary;
}

export const createReview = async (payload: ReviewPayload) => {
  const response = await api.post('/reviews', payload);
  return response.data.data as ReviewItem;
};

export const getSellerReviews = async (sellerId: string, params: Record<string, any> = {}) => {
  const response = await api.get(`/reviews/seller/${sellerId}`, { params });
  return response.data.data as SellerReviewsResponse;
};


