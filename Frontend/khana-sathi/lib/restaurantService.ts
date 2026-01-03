import { post, get, put, del } from './api';



export interface RestaurantPayload {
  name?: string;
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
