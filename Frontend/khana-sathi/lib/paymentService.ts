import { get, post } from './api';

export interface EsewaPaymentData {
    paymentUrl: string;
    formData: {
        amount: string;
        tax_amount: string;
        total_amount: string;
        transaction_uuid: string;
        product_code: string;
        product_service_charge: string;
        product_delivery_charge: string;
        success_url: string;
        failure_url: string;
        signed_field_names: string;
        signature: string;
    };
}

export interface KhaltiPaymentData {
    paymentUrl: string;
    pidx: string;
}

export interface PaymentStatusResponse {
    success: boolean;
    data: {
        paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
        paymentMethod: string;
    };
}

export interface InitiatePaymentFromCartRequest {
    deliveryAddress: {
        addressLine1: string;
        city: string;
        state: string;
        zipCode: string;
    };
    specialInstructions?: string;
    useLoyaltyPoints?: boolean;
}

/**
 * Initiate eSewa payment from cart (before order creation)
 * This is the new flow where payment happens first
 */
export async function initiateEsewaFromCart(data: InitiatePaymentFromCartRequest) {
    return post<{ success: boolean; data: EsewaPaymentData }>('/payment/esewa/initiate-from-cart', data);
}

/**
 * Initiate Khalti payment from cart (before order creation)
 * This is the new flow where payment happens first
 */
export async function initiateKhaltiFromCart(data: InitiatePaymentFromCartRequest) {
    return post<{ success: boolean; data: KhaltiPaymentData }>('/payment/khalti/initiate-from-cart', data);
}

/**
 * Initiate eSewa payment for existing order (legacy)
 */
export async function initiateEsewaPayment(orderId: string) {
    return post<{ success: boolean; data: EsewaPaymentData }>('/payment/esewa/initiate', { orderId });
}

/**
 * Verify eSewa payment
 */
export async function verifyEsewaPayment(data: string) {
    return post<{ success: boolean; data: { orderId: string; orders?: string[]; paymentStatus: string } }>('/payment/esewa/verify', { data });
}

/**
 * Initiate Khalti payment for existing order (legacy)
 */
export async function initiateKhaltiPayment(orderId: string) {
    return post<{ success: boolean; data: KhaltiPaymentData }>('/payment/khalti/initiate', { orderId });
}

/**
 * Verify Khalti payment
 */
export async function verifyKhaltiPayment(pidx: string, pendingId: string) {
    return post<{ success: boolean; data: { orderId: string; orders?: string[]; paymentStatus: string } }>('/payment/khalti/verify', { pidx, pendingId });
}

/**
 * Get payment status for an order
 */
export async function getPaymentStatus(orderId: string) {
    return get<PaymentStatusResponse>(`/payment/${orderId}/status`);
}

/**
 * Redirect to eSewa payment page via form submission
 */
export function redirectToEsewa(paymentData: EsewaPaymentData) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.paymentUrl;

    Object.entries(paymentData.formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

/**
 * Redirect to Khalti payment page
 */
export function redirectToKhalti(paymentUrl: string) {
    window.location.href = paymentUrl;
}
