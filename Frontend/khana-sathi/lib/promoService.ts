import { get, post, put, del } from './api';

// Types
export interface PromoCode {
    _id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    perUserLimit?: number;
    usedCount: number;
    isActive: boolean;
    createdBy?: { _id: string; username: string; email: string; role: string } | string;
    createdAt: string;
}

export interface CreatePromoInput {
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    perUserLimit?: number;
}

// Get all promo codes (Admin/Restaurant)
export async function getPromoCodes(options?: { mine?: boolean }) {
    const params = new URLSearchParams();
    if (options?.mine) params.append('mine', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<{ success: boolean; count: number; data: PromoCode[] }>(`/promo${query}`);
}

// Get active promo codes (for customers)
export async function getActivePromoCodes() {
    return get<{ success: boolean; count: number; data: PromoCode[] }>('/promo/active');
}

// Create new promo code
export async function createPromoCode(data: CreatePromoInput) {
    return post<{ success: boolean; message: string; data: PromoCode }>('/promo', data);
}

// Update promo code
export async function updatePromoCode(id: string, data: Partial<CreatePromoInput>) {
    return put<{ success: boolean; message: string; data: PromoCode }>(`/promo/${id}`, data);
}

// Delete promo code
export async function deletePromoCode(id: string) {
    return del<{ success: boolean; message: string }>(`/promo/${id}`);
}

// Toggle promo code status
export async function togglePromoCodeStatus(id: string) {
    return put<{ success: boolean; message: string; data: PromoCode }>(`/promo/${id}/toggle`, {});
}

// Validate promo code (for checkout)
export async function validatePromoCode(code: string, orderAmount: number, restaurantId?: string) {
    return post<{ success: boolean; data: { code: string; discountType: string; discountValue: number; calculatedDiscount: number; description: string } }>('/promo/validate', { code, orderAmount, restaurantId });
}

// Broadcast promo code notification
export async function broadcastPromo(id: string) {
    return post<{ success: boolean; message: string }>(`/promo/broadcast/${id}`, {});
}
