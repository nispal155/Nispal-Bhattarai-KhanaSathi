import { get, post, put } from './api';
import type { DeliveryAddress, Order } from './orderService';

// Multi-Order Types
export interface SubOrderTracking {
    _id: string;
    orderNumber: string;
    restaurant: {
        _id: string;
        name: string;
        logoUrl?: string;
        address?: {
            addressLine1?: string;
            city?: string;
        };
    };
    status: string;
    statusHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
    }>;
    isReady: boolean;
    isPickedUp: boolean;
}

export interface PaymentDistribution {
    restaurant: string;
    amount: number;
    percentage: number;
    status: 'pending' | 'pending_settlement' | 'settled' | 'refunded';
    settledAt?: string;
}

export interface MultiOrder {
    _id: string;
    orderNumber: string;
    customer: {
        _id: string;
        username: string;
        email?: string;
        phone?: string;
    };
    subOrders: Order[];
    restaurantCount: number;
    primaryRider?: {
        _id: string;
        username: string;
        profilePicture?: string;
        phone?: string;
        vehicleDetails?: {
            type: string;
            model: string;
            licensePlate: string;
        };
    };
    status:
    | 'pending'
    | 'partially_confirmed'
    | 'all_confirmed'
    | 'preparing'
    | 'partially_ready'
    | 'all_ready'
    | 'picking_up'
    | 'picked_up'
    | 'on_the_way'
    | 'delivered'
    | 'cancelled';
    pickupStatus: Array<{
        subOrder: string;
        restaurant: string;
        isReady: boolean;
        isPickedUp: boolean;
        readyAt?: string;
        pickedUpAt?: string;
    }>;
    deliveryAddress: DeliveryAddress;
    pricing: {
        subtotal: number;
        deliveryFee: number;
        serviceFee: number;
        discount: number;
        total: number;
    };
    paymentMethod: 'esewa' | 'khalti' | 'card' | 'bank' | 'cod';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    paymentDistribution: PaymentDistribution[];
    specialInstructions?: string;
    promoCode?: string;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    statusHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface MultiOrderResponse {
    success: boolean;
    data: MultiOrder;
    message?: string;
}

export interface MultiOrdersResponse {
    success: boolean;
    count: number;
    total: number;
    pages: number;
    data: MultiOrder[];
}

export interface MultiOrderTrackingData {
    orderNumber: string;
    overallStatus: string;
    statusHistory: Array<{ status: string; timestamp: string; note?: string }>;
    restaurantCount: number;
    rider?: MultiOrder['primaryRider'];
    deliveryAddress: DeliveryAddress;
    estimatedDeliveryTime?: string;
    subOrders: SubOrderTracking[];
    pricing: MultiOrder['pricing'];
    createdAt: string;
}

// Get a single multi-order by ID
export async function getMultiOrderById(multiOrderId: string) {
    return get<MultiOrderResponse>(`/multi-orders/${multiOrderId}`);
}

// Get customer's multi-orders
export async function getMyMultiOrders(options?: {
    status?: string;
    limit?: number;
    page?: number;
}) {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.page) params.append('page', options.page.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return get<MultiOrdersResponse>(`/multi-orders/my-orders${query}`);
}

// Get multi-order tracking data
export async function getMultiOrderTracking(multiOrderId: string) {
    return get<{ success: boolean; data: MultiOrderTrackingData }>(`/multi-orders/${multiOrderId}/tracking`);
}

// Cancel a multi-order
export async function cancelMultiOrder(multiOrderId: string, reason?: string) {
    return put<MultiOrderResponse>(`/multi-orders/${multiOrderId}/cancel`, { reason });
}

// Rider: Get assigned multi-orders
export async function getRiderMultiOrders(status?: 'active' | 'completed') {
    const query = status ? `?status=${status}` : '';
    return get<MultiOrdersResponse>(`/multi-orders/rider/orders${query}`);
}

// Rider: Get available multi-orders for assignment
export async function getAvailableMultiOrders() {
    return get<MultiOrdersResponse>('/multi-orders/available');
}

// Rider: Mark a sub-order as picked up
export async function markSubOrderPickedUp(multiOrderId: string, subOrderId: string) {
    return put<{
        success: boolean;
        message: string;
        data: {
            allPickedUp: boolean;
            pickupStatus: MultiOrder['pickupStatus'];
        };
    }>(`/multi-orders/${multiOrderId}/pickup/${subOrderId}`, {});
}

// Rider: Update multi-order delivery status
export async function updateMultiOrderDeliveryStatus(
    multiOrderId: string,
    status: 'on_the_way' | 'delivered'
) {
    return put<MultiOrderResponse>(`/multi-orders/${multiOrderId}/delivery-status`, { status });
}

// Rider: Update location for multi-order
export async function updateMultiOrderRiderLocation(
    multiOrderId: string,
    lat: number,
    lng: number
) {
    return post<{ success: boolean; message: string }>(`/multi-orders/${multiOrderId}/location`, { lat, lng });
}

// Admin/Restaurant: Assign rider to multi-order
export async function assignRiderToMultiOrder(multiOrderId: string, riderId: string) {
    return put<MultiOrderResponse>(`/multi-orders/${multiOrderId}/assign-rider`, { riderId });
}

// Helper: Convert multi-order status to display text
export function getMultiOrderStatusText(status: MultiOrder['status']): string {
    const statusMap: Record<MultiOrder['status'], string> = {
        pending: 'Order Placed',
        partially_confirmed: 'Partially Confirmed',
        all_confirmed: 'All Restaurants Confirmed',
        preparing: 'Being Prepared',
        partially_ready: 'Some Orders Ready',
        all_ready: 'All Orders Ready',
        picking_up: 'Rider Picking Up',
        picked_up: 'All Picked Up',
        on_the_way: 'On the Way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
}

// Helper: Get status color for multi-order
export function getMultiOrderStatusColor(status: MultiOrder['status']): string {
    if (status === 'delivered') return 'bg-green-100 text-green-700';
    if (status === 'cancelled') return 'bg-red-100 text-red-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (status.includes('ready')) return 'bg-purple-100 text-purple-700';
    if (status === 'on_the_way' || status === 'picked_up') return 'bg-indigo-100 text-indigo-700';
    return 'bg-blue-100 text-blue-700';
}
