import { get, post, put, del } from './api';

export const CART_UPDATED_EVENT = 'khana-sathi:cart-updated';

function emitCartUpdated(itemCount?: number) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, {
    detail: typeof itemCount === 'number' ? { itemCount } : undefined
  }));
}

// Types
export interface CartItem {
  _id?: string;
  menuItem: string | {
    _id: string;
    name?: string;
    price?: number;
    image?: string;
    isAvailable?: boolean;
  };
  name: string;
  price: number;
  image?: string;
  quantity: number;
  specialInstructions?: string;
  addedBy: {
    _id: string;
    username: string;
  };
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
  isShared: boolean;
  shareCode?: string;
  collaborators: {
    _id: string;
    username: string;
    profilePicture?: string;
  }[];
  parentApproval?: {
    status: 'not_required' | 'pending_parent_approval' | 'approved' | 'rejected';
    requestedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    note?: string;
  };
}

export interface ChildCartRequest {
  _id: string;
  child: {
    _id: string;
    username: string;
    email: string;
    displayName?: string;
    profilePicture?: string;
  };
  restaurantGroups: RestaurantGroup[];
  itemCount: number;
  subtotal: number;
  promoCode?: string;
  promoDiscount: number;
  requestedAt?: string;
  reviewedAt?: string;
  parentApproval: {
    status: 'not_required' | 'pending_parent_approval' | 'approved' | 'rejected';
    requestedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    note?: string;
  };
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
  const response = await post<CartResponse>('/cart/add', {
    menuItemId,
    quantity,
    specialInstructions
  });

  emitCartUpdated(response.data?.data?.itemCount);
  return response;
}

// Update cart item
export async function updateCartItem(menuItemId: string, quantity: number, specialInstructions?: string) {
  const response = await put<CartResponse>('/cart/update', {
    menuItemId,
    quantity,
    specialInstructions
  });

  emitCartUpdated(response.data?.data?.itemCount);
  return response;
}

// Remove item from cart
export async function removeFromCart(menuItemId: string) {
  const response = await del<CartResponse>(`/cart/remove/${menuItemId}`);
  emitCartUpdated(response.data?.data?.itemCount);
  return response;
}

// Clear cart
export async function clearCart() {
  const response = await del<{ success: boolean; message: string }>('/cart/clear');
  emitCartUpdated(0);
  return response;
}

// Apply promo code
export async function applyPromoCode(code: string) {
  return post<{ success: boolean; data: { code: string; discount: number }; message: string }>('/cart/apply-promo', { code });
}

// Remove promo code
export async function removePromoCode() {
  return del<{ success: boolean; message: string }>('/cart/remove-promo');
}

// Create shared cart
export async function shareCart() {
  const response = await post<CartResponse>('/cart/share', {});
  emitCartUpdated(response.data?.data?.itemCount);
  return response;
}

// Join shared cart
export async function joinCart(shareCode: string) {
  const response = await post<CartResponse>('/cart/join', { shareCode });
  emitCartUpdated(response.data?.data?.itemCount);
  return response;
}

export async function requestParentApproval(note?: string) {
  return post<{ success: boolean; message: string; data: { status: string; requestedAt?: string } }>(
    '/cart/request-parent-approval',
    { note: note || '' }
  );
}

export async function getChildCartRequests() {
  return get<{ success: boolean; data: ChildCartRequest[] }>('/cart/child-requests');
}

export async function getChildCartRequestById(cartId: string) {
  return get<{ success: boolean; data: ChildCartRequest }>(`/cart/child-requests/${cartId}`);
}

export async function addItemToChildCartRequest(cartId: string, menuItemId: string, quantity: number = 1, specialInstructions?: string) {
  return post<{ success: boolean; message: string; data: ChildCartRequest }>(`/cart/child-requests/${cartId}/items`, {
    menuItemId,
    quantity,
    specialInstructions
  });
}

export async function approveChildCartRequest(cartId: string, note?: string) {
  return put<{ success: boolean; message: string }>(`/cart/child-requests/${cartId}/approve`, { note: note || '' });
}

export async function rejectChildCartRequest(cartId: string, note?: string) {
  return put<{ success: boolean; message: string }>(`/cart/child-requests/${cartId}/reject`, { note: note || '' });
}

export async function updateChildCartRequestItem(cartId: string, menuItemId: string, quantity: number, specialInstructions?: string) {
  return put<{ success: boolean; message: string; data: ChildCartRequest }>(`/cart/child-requests/${cartId}/items`, {
    menuItemId,
    quantity,
    specialInstructions
  });
}
