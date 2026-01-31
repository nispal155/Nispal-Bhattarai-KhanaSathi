import { get, post, put, del } from './api';

// Types
export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: string;
  allergens: string[];
  preparationTime: number;
  calories?: number;
  restaurant: string;
  ratings: {
    average: number;
    count: number;
  };
}

export interface MenuResponse {
  success: boolean;
  count?: number;
  data: MenuItem[] | Record<string, MenuItem[]>;
  message?: string;
}

// Get menu for a specific restaurant
export async function getRestaurantMenu(restaurantId: string, filters?: {
  category?: string;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
}) {
  let endpoint = `/menu/restaurant/${restaurantId}`;
  const params = new URLSearchParams();
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.vegetarian) params.append('vegetarian', 'true');
  if (filters?.vegan) params.append('vegan', 'true');
  if (filters?.glutenFree) params.append('glutenFree', 'true');
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  return get<MenuResponse>(endpoint);
}

// Get restaurant manager's menu
export async function getMyMenu() {
  return get<MenuResponse>('/menu/my-menu');
}

// Create menu item
export async function createMenuItem(menuItem: Partial<MenuItem>) {
  return post<{ success: boolean; data: MenuItem; message: string }>('/menu', menuItem);
}

// Update menu item
export async function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  return put<{ success: boolean; data: MenuItem; message: string }>(`/menu/${id}`, updates);
}

// Delete menu item
export async function deleteMenuItem(id: string) {
  return del<{ success: boolean; message: string }>(`/menu/${id}`);
}

// Toggle menu item availability
export async function toggleMenuAvailability(id: string) {
  return put<{ success: boolean; data: MenuItem; message: string }>(`/menu/${id}/toggle-availability`, {});
}

// Search menu items
export async function searchMenuItems(query: string, filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  vegetarian?: boolean;
  vegan?: boolean;
}) {
  const params = new URLSearchParams({ q: query });
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.vegetarian) params.append('vegetarian', 'true');
  if (filters?.vegan) params.append('vegan', 'true');
  
  return get<MenuResponse>(`/menu/search?${params.toString()}`);
}
