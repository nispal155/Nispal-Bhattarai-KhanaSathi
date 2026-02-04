import { get, post, put } from './api';

// Types
export interface OrderItem {
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface DeliveryAddress {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    username: string;
    email: string;
  };
  restaurant: {
    _id: string;
    name: string;
    address: object;
    contactPhone: string;
    logoUrl?: string;
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';
  deliveryAddress: DeliveryAddress;
  deliveryRider?: {
    _id: string;
    username: string;
    profilePicture?: string;
    averageRating: number;
    vehicleDetails?: {
      type: string;
      model: string;
      licensePlate: string;
    };
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  paymentMethod: 'esewa' | 'khalti' | 'card' | 'bank' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialInstructions?: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  promoCode?: string;
  isRated: boolean;
  sosStatus?: 'none' | 'active' | 'resolved';
  riderLocationHistory?: Array<{
    lat: number;
    lng: number;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  data: Order | Order[];
  message?: string;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  total: number;
  pages: number;
  data: Order[];
}

// Create new order
export async function createOrder(orderData: {
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  specialInstructions?: string;
  promoCode?: string;
}) {
  return post<OrderResponse>('/orders', orderData);
}

// Get user's orders
export async function getMyOrders(options?: {
  status?: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.page) params.append('page', options.page.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return get<OrdersResponse>(`/orders/my-orders${query}`);
}

// Get single order
export async function getOrderById(orderId: string) {
  return get<OrderResponse>(`/orders/${orderId}`);
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string) {
  return put<OrderResponse>(`/orders/${orderId}/cancel`, { reason });
}

// Restaurant: Get orders
export async function getRestaurantOrders(options?: {
  status?: string;
  date?: string;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.date) params.append('date', options.date);

  const query = params.toString() ? `?${params.toString()}` : '';
  return get<OrdersResponse>(`/orders/restaurant${query}`);
}

// Restaurant: Update order status
export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  return put<OrderResponse>(`/orders/${orderId}/status`, { status, note });
}

// Restaurant: Assign rider
export async function assignRider(orderId: string, riderId: string) {
  return put<OrderResponse>(`/orders/${orderId}/assign-rider`, { riderId });
}

// Rider: Get assigned orders
export async function getRiderOrders(status?: 'active' | 'completed') {
  const query = status ? `?status=${status}` : '';
  return get<OrdersResponse>(`/orders/rider${query}`);
}

// Rider: Get available orders
export async function getAvailableOrders() {
  return get<OrdersResponse>('/orders/available');
}

// Rider: Accept order
export async function acceptOrder(orderId: string) {
  return put<OrderResponse>(`/orders/${orderId}/accept`, {});
}

// Rider: Update delivery status
export async function updateDeliveryStatus(orderId: string, status: 'on_the_way' | 'delivered') {
  return put<OrderResponse>(`/orders/${orderId}/delivery-status`, { status });
}

// Admin: Get order statistics
export async function getOrderStats() {
  return get<{
    success: boolean;
    data: {
      totalOrders: number;
      todayOrders: number;
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
      totalRevenue: number;
    };
  }>('/orders/stats');
}

// Rider: Trigger SOS
export async function triggerSOS(orderId: string) {
  return post<OrderResponse>(`/orders/${orderId}/sos`, {});
}

// Rider: Update Location
export async function updateRiderLocation(orderId: string, lat: number, lng: number) {
  return post<OrderResponse>(`/orders/${orderId}/location`, { lat, lng });
}

// Rider: Get Order Pools
export async function getOrderPools() {
  return get<{ success: boolean; data: any[] }>('/orders/pools');
}

// Admin: Get all orders
export async function getAllOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return get<OrdersResponse>(`/orders/admin${query}`);
}
