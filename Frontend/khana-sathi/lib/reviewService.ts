import { get, post, put, del } from './api';

// Types
export interface Review {
  _id: string;
  order: string;
  customer: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  restaurant?: string;
  restaurantRating?: number;
  foodRating?: number;
  restaurantReview?: string;
  deliveryRider?: string;
  deliveryRating?: number;
  deliveryReview?: string;
  itemReviews?: Array<{
    menuItem: string;
    rating: number;
    comment?: string;
  }>;
  overallRating: number;
  comment?: string;
  images?: string[];
  isPublic: boolean;
  response?: {
    text: string;
    respondedBy: string;
    respondedAt: string;
  };
  createdAt: string;
}

export interface ReviewsResponse {
  success: boolean;
  count: number;
  total: number;
  pages?: number;
  ratingBreakdown?: Array<{ _id: number; count: number }>;
  data: Review[];
}

export interface ReviewResponse {
  success: boolean;
  data: Review;
  message?: string;
}

// Create a review
export async function createReview(reviewData: {
  orderId: string;
  restaurantRating?: number;
  foodRating?: number;
  restaurantReview?: string;
  deliveryRating?: number;
  deliveryReview?: string;
  itemReviews?: Array<{ menuItem: string; rating: number; comment?: string }>;
  overallRating: number;
  comment?: string;
  images?: string[];
}) {
  return post<ReviewResponse>('/reviews', reviewData);
}

// Get restaurant reviews
export async function getRestaurantReviews(restaurantId: string, options?: {
  limit?: number;
  page?: number;
  sort?: string;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.page) params.append('page', options.page.toString());
  if (options?.sort) params.append('sort', options.sort);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return get<ReviewsResponse>(`/reviews/restaurant/${restaurantId}${query}`);
}

// Get rider reviews
export async function getRiderReviews(riderId: string, options?: {
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.page) params.append('page', options.page.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return get<ReviewsResponse>(`/reviews/rider/${riderId}${query}`);
}

// Get my reviews
export async function getMyReviews() {
  return get<ReviewsResponse>('/reviews/my-reviews');
}

// Restaurant: Respond to review
export async function respondToReview(reviewId: string, text: string) {
  return put<ReviewResponse>(`/reviews/${reviewId}/respond`, { text });
}

// Delete review
export async function deleteReview(reviewId: string) {
  return del<{ success: boolean; message: string }>(`/reviews/${reviewId}`);
}
