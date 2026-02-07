import { get, post, put, del } from './api';

// Types
export interface AuditLogEntry {
    action: string;
    performedBy: { _id: string; username: string; email: string; role: string } | string;
    performedByRole: string;
    changes: Record<string, { from: unknown; to: unknown }> | null;
    timestamp: string;
}

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
    scope: 'global' | 'restaurant';
    restaurant?: { _id: string; name: string } | string | null;
    createdBy?: { _id: string; username: string; email: string; role: string } | string;
    createdByRole?: 'admin' | 'restaurant';
    applicableRestaurants?: { _id: string; name: string }[] | string[];
    applicableCategories?: string[];
    auditLog?: AuditLogEntry[];
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
    scope?: 'global' | 'restaurant';
    applicableRestaurants?: string[];
}

// Get all promo codes (Admin/Restaurant — role-aware filtering on backend)
export async function getPromoCodes(options?: { active?: boolean; expired?: boolean }) {
    const params = new URLSearchParams();
    if (options?.active) params.append('active', 'true');
    if (options?.expired) params.append('expired', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<{ success: boolean; count: number; data: PromoCode[] }>(`/promo${query}`);
}

// Get active promo codes (for customers)
export async function getActivePromoCodes(restaurantId?: string) {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<{ success: boolean; count: number; data: PromoCode[] }>(`/promo/active${query}`);
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

// Broadcast promo code notification (Admin only)
export async function broadcastPromo(id: string) {
    return post<{ success: boolean; message: string }>(`/promo/broadcast/${id}`, {});
}

// Get audit log for a promo code (Admin only)
export async function getPromoAuditLog(id: string) {
    return get<{ success: boolean; data: { code: string; auditLog: AuditLogEntry[] } }>(`/promo/${id}/audit`);
}
