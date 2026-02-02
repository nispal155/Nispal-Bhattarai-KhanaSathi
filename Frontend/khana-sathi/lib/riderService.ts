import { get } from './api';

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

// Get rider delivery history
export async function getRiderHistory(riderId: string, filters?: { status?: string; period?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.period) params.append('period', filters.period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<{ success: boolean; count: number; data: HistoryItem[] }>(`/staff/history/${riderId}${query}`);
}
