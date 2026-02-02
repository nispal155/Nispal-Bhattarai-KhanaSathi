import { get, post, put, del } from './api';

// Types
export interface CartItem {
  menuItem: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  specialInstructions?: string;
}

export interface RestaurantGroup {
  restaurant: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  items: CartItem[];
}

export interface Cart {
  _id: string;
  user: string;
  restaurantGroups: RestaurantGroup[];
  promoCode?: string;
  promoDiscount: number;
  subtotal: number;
  itemCount: number;
}

export interface CartSummary {
  restaurantGroups: RestaurantGroup[];
  itemCount: number;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  promoCode?: string;
}

export interface CartResponse {
  success: boolean;
  data: Cart;
  message?: string;
}

// Get cart
export async function getCart() {
  return get<CartResponse>('/cart');
}

// Get cart summary
export async function getCartSummary() {
  return get<{ success: boolean; data: CartSummary }>('/cart/summary');
}

// Add item to cart
export async function addToCart(menuItemId: string, quantity: number = 1, specialInstructions?: string) {
  return post<CartResponse>('/cart/add', {
    menuItemId,
    quantity,
    specialInstructions
  });
}

// Update cart item
export async function updateCartItem(menuItemId: string, quantity: number, specialInstructions?: string) {
  return put<CartResponse>('/cart/update', {
    menuItemId,
    quantity,
    specialInstructions
  });
}

// Remove item from cart
export async function removeFromCart(menuItemId: string) {
  return del<CartResponse>(`/cart/remove/${menuItemId}`);
}

// Clear cart
export async function clearCart() {
  return del<{ success: boolean; message: string }>('/cart/clear');
}

// Apply promo code
export async function applyPromoCode(code: string) {
  return post<{ success: boolean; data: { code: string; discount: number }; message: string }>('/cart/apply-promo', { code });
}

// Remove promo code
export async function removePromoCode() {
  return del<{ success: boolean; message: string }>('/cart/remove-promo');
}
