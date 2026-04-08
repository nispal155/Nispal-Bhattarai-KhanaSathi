import { get, post } from './api';

// Types
export interface RiderStats {
    todayDeliveries: number;
    totalDeliveries: number;
    todayEarnings: number;
    totalEarnings: number;
    avgRating: number;
    reviewCount: number;
    isOnline: boolean;
    currentOrder: {
        _id: string;
        orderNumber: string;
        restaurant: { name: string; address?: object };
        customer: { username: string };
        status: string;
    } | null;
}

export interface EarningsData {
    today: { deliveries: number; earnings: number };
    week: { deliveries: number; earnings: number };
    month: { deliveries: number; earnings: number };
    total: { deliveries: number; earnings: number };
    dailyBreakdown: Array<{
        date: string;
        deliveries: number;
        earnings: number;
    }>;
}

export interface RiderPaymentClaim {
    _id: string;
    rider: string;
    periodType: 'daily' | 'weekly';
    periodLabel: string;
    referenceDate: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    deliveriesCount: number;
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    claimedAt: string | null;
    processedAt: string | null;
    adminNote: string;
    orderIds: string[];
    createdAt: string | null;
    updatedAt: string | null;
}

export interface ClaimSummaryPeriod {
    periodType: 'daily' | 'weekly';
    periodLabel: string;
    referenceDate: string;
    periodStart: string;
    periodEnd: string;
    deliveries: number;
    amount: number;
    claimedDeliveries: number;
    claimedAmount: number;
    existingClaim: RiderPaymentClaim | null;
}

export interface RiderClaimSummary {
    daily: ClaimSummaryPeriod;
    weekly: ClaimSummaryPeriod;
}

export interface HistoryItem {
    _id: string;
    orderNumber: string;
    restaurant: string;
    customer: string;
    status: string;
    earnings: number;
    date: string;
}

// Get rider dashboard statistics
export async function getRiderStats(riderId: string) {
    return get<{ success: boolean; data: RiderStats }>(`/staff/stats/${riderId}`);
}

// Get rider earnings breakdown
export async function getRiderEarnings(riderId: string) {
    return get<{ success: boolean; data: EarningsData }>(`/staff/earnings/${riderId}`);
}

export async function getRiderClaimSummary(referenceDate?: string) {
    const query = referenceDate ? `?referenceDate=${encodeURIComponent(referenceDate)}` : '';
    return get<{ success: boolean; data: RiderClaimSummary }>(`/staff/claims/summary${query}`);
}

export async function createRiderPaymentClaim(data: {
    periodType: 'daily' | 'weekly';
    referenceDate?: string;
}) {
    return post<{ success: boolean; message?: string; data: RiderPaymentClaim }>('/staff/claims', data);
}

export async function getRiderPaymentClaims(filters?: {
    status?: 'pending' | 'approved' | 'paid' | 'rejected' | 'active';
    periodType?: 'daily' | 'weekly';
}) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.periodType) params.append('periodType', filters.periodType);
    const query = params.toString() ? `?${params.toString()}` : '';

    return get<{ success: boolean; count: number; data: RiderPaymentClaim[] }>(`/staff/claims${query}`);
}

// Get rider delivery history
export async function getRiderHistory(riderId: string, filters?: { status?: string; period?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period) params.append('period', filters.period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<{ success: boolean; count: number; data: HistoryItem[] }>(`/staff/history/${riderId}${query}`);
}

// Available rider for assignment
export interface AvailableRider {
    _id: string;
    username: string;
    profilePicture?: string;
    averageRating: number;
    completedOrders: number;
    vehicleDetails?: {
        type: string;
        model: string;
        licensePlate: string;
    };
}

// Get available (online) riders for order assignment
export async function getAvailableRiders() {
    return get<{ success: boolean; count: number; data: AvailableRider[] }>('/staff/available');
}
