import { post, get, put, del } from './api';



export interface RestaurantPayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cuisineType?: string;
  openingHour?: string;
  closingHour?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  cuisineType: string[];
  openingHour: string;
  closingHour: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  tags: string[];
  createdAt: string;
}



interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}


/**
 * CREATE RESTAURANT
 * POST /api/restaurants
 */
export async function createRestaurant(
  payload: RestaurantPayload
) {
  return post<ApiResponse<Restaurant>>('/restaurant', payload);
}

/**
 * GET ALL RESTAURANTS
 * GET /api/restaurants
 */
export async function getAllRestaurants() {
  return get<ApiResponse<Restaurant[]>>('/restaurant');
}

/**
 * GET SINGLE RESTAURANT
 * GET /api/restaurants/:id
 */
export async function getRestaurantById(id: string) {
  return get<ApiResponse<Restaurant>>(`/restaurant/${id}`);
}

/**
 * UPDATE RESTAURANT
 * PUT /api/restaurants/:id
 */
export async function updateRestaurant(
  id: string,
  payload: RestaurantPayload
) {
  return put<ApiResponse<Restaurant>>(`/restaurant/${id}`, payload);
}

/**
 * DELETE RESTAURANT (SOFT DELETE)
 * DELETE /api/restaurants/:id
 */
export async function deleteRestaurant(id: string) {
  return del<ApiResponse<null>>(`/restaurant/${id}`);
}

/**
 * ONBOARD RESTAURANT
 * PUT /api/restaurants/onboard
 */
export async function onboardRestaurant(payload: any) {
  return put<ApiResponse<Restaurant>>('/restaurant/onboard', payload);
}

/**
 * APPROVE RESTAURANT
 * PUT /api/restaurants/approve/:userId
 */
export async function approveRestaurant(userId: string) {
  return put<ApiResponse<null>>(`/restaurant/approve/${userId}`, {});
}

/**
 * GET ONBOARDING DETAILS
 * GET /api/restaurants/onboarding-details/:userId
 */
export async function getOnboardingDetails(userId: string) {
  return get<ApiResponse<any>>(`/restaurant/onboarding-details/${userId}`);
}
