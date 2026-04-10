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
  cuisineType?: string | string[];
  openingHour?: string;
  closingHour?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  isActive?: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  priceRange?: string;
  tags?: string[];
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
    coordinates?: {
      lat?: number | null;
      lng?: number | null;
    };
  };
  cuisineType: string[];
  openingHour: string;
  closingHour: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl?: string;
  isActive: boolean;
  description?: string;
  minimumOrder?: number;
  deliveryRadius?: number;
  averageRating: number;
  reviewCount: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  priceRange: 'Rs.' | 'Rs.Rs.' | 'Rs.Rs.Rs.' | 'Rs.Rs.Rs.Rs.';
  tags: string[];
  createdBy: string;
  createdAt: string;
  distanceKm?: number | null;
}



interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

export interface OnboardingDetails {
  user?: {
    username: string;
    email?: string;
  };
  restaurant?: {
    name: string;
    address?: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    contactPhone: string;
    contactEmail?: string;
    openingHour: string;
    closingHour: string;
  };
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
export async function getAllRestaurants(options?: {
  search?: string;
  status?: string;
  cuisine?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.status) params.append('status', options.status);
  if (options?.cuisine) params.append('cuisine', options.cuisine);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return get<ApiResponse<Restaurant[]> & { total?: number; pages?: number }>(`/restaurant${query}`);
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
export async function onboardRestaurant(payload: Record<string, unknown>) {
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
  return get<ApiResponse<OnboardingDetails>>(`/restaurant/onboarding-details/${userId}`);
}
/**
 * GET NEARBY RESTAURANTS
 * GET /api/restaurant/nearby?city=...
 */
export async function getNearbyRestaurants(options: {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}) {
  const params = new URLSearchParams();
  if (options.city) params.append('city', options.city);
  if (typeof options.lat === 'number') params.append('lat', options.lat.toString());
  if (typeof options.lng === 'number') params.append('lng', options.lng.toString());
  if (typeof options.radiusKm === 'number') params.append('radiusKm', options.radiusKm.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return get<ApiResponse<Restaurant[]> & { meta?: { city?: string | null; radiusKm?: number | null; locationMode?: string } }>(`/restaurant/nearby${query}`);
}
/**
 * GET CURRENT USER'S RESTAURANT
 * GET /api/restaurant/my-restaurant
 */
export async function getMyRestaurant() {
  return get<ApiResponse<Restaurant>>('/restaurant/my-restaurant');
}

/**
 * UPDATE CURRENT USER'S RESTAURANT
 * PUT /api/restaurant/my-restaurant
 */
export async function updateMyRestaurant(payload: RestaurantPayload) {
  return put<ApiResponse<Restaurant>>('/restaurant/my-restaurant', payload);
}
