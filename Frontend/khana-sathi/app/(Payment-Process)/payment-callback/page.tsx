'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEsewaPayment, verifyKhaltiPayment } from '@/lib/paymentService';
import { verifyGroupEsewa, verifyGroupKhalti } from '@/lib/groupCartService';
import type { InitiateGroupOrderResponse } from '@/lib/groupCartService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

function extractPayload<T>(response: { data?: unknown } | undefined): T | undefined {
    const payload = response?.data;
    if (!payload || typeof payload !== 'object') return payload as T | undefined;
    if ('data' in payload) {
        const nested = (payload as { data?: T }).data;
        return nested ?? (payload as T);
    }
    return payload as T;
}

function PaymentCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [groupCartId, setGroupCartId] = useState<string | null>(null);

    useEffect(() => {
        const verifyPayment = async () => {
            const fullUrl = window.location.href;
            console.log('Full URL:', fullUrl);

            // eSewa appends ?data=... to success URL, creating malformed URL like:
            // /payment-callback?method=esewa&status=success?data=eyJ...
            // We need to extract the data parameter manually
            let data = searchParams.get('data'); // Try normal parsing first

            // If data is null, check for malformed URL with double question mark
            if (!data && fullUrl.includes('?data=')) {
                const dataMatch = fullUrl.match(/[?&]data=([^&]+)/);
                if (dataMatch) {
                    data = decodeURIComponent(dataMatch[1]);
                    console.log('Extracted data from malformed URL:', data);
                }
            }

            const method = searchParams.get('method');
            const pidx = searchParams.get('pidx'); // Khalti callback
            const pendingId = searchParams.get('pendingId'); // Pending payment ID for Khalti
            const esewaStatus = searchParams.get('status'); // eSewa status param
            const paymentType = searchParams.get('type'); // 'group' for group payments
            // eSewa appends ?data=... to the success URL, which can pollute groupCartId
            // e.g. groupCartId=abc123?data=eyJ... — strip everything after ? or &
            const rawGcId = searchParams.get('groupCartId');
            const gcId = rawGcId ? rawGcId.split('?')[0].split('&')[0] : null;

            if (gcId) setGroupCartId(gcId);

            console.log('Payment callback params:', { method, data: data ? 'present' : 'null', pidx, pendingId, esewaStatus, paymentType, gcId });

            try {
                // ── GROUP PAYMENT FLOW ──
                if (paymentType === 'group' && gcId) {
                    // eSewa group payment
                    if (data || method === 'esewa') {
                        if (esewaStatus === 'failure') {
                            setStatus('failed');
                            setMessage('Payment was cancelled or failed.');
                            return;
                        }
                        if (data) {
                            setMessage('Verifying eSewa payment for your group order...');
                            const response = await verifyGroupEsewa(data, gcId);
                            const resData = extractPayload<InitiateGroupOrderResponse['data']>(response as { data?: unknown } | undefined);
                            if (response.data?.success) {
                                setStatus('success');
                                if (resData?.orderPlaced) {
                                    setMessage('Payment verified. Group order has been placed.');
                                    setOrderId(resData.orders?.[0]?.orderId);
                                } else {
                                    setMessage('Your payment is complete. Waiting for other members to pay.');
                                }
                            } else {
                                setStatus('failed');
                                setMessage((response as { error?: string }).error || 'Payment verification failed.');
                            }
                        } else {
                            setStatus('failed');
                            setMessage('No payment data received from eSewa.');
                        }
                        return;
                    }
                    // Khalti group payment
                    if (pidx || method === 'khalti') {
                        if (pidx && pendingId) {
                            setMessage('Verifying Khalti payment for your group order...');
                            const response = await verifyGroupKhalti(pidx, pendingId, gcId);
                            const resData = extractPayload<InitiateGroupOrderResponse['data']>(response as { data?: unknown } | undefined);
                            if (response.data?.success) {
                                setStatus('success');
                                if (resData?.orderPlaced) {
                                    setMessage('Payment verified. Group order has been placed.');
                                    setOrderId(resData.orders?.[0]?.orderId);
                                } else {
                                    setMessage('Your payment is complete. Waiting for other members to pay.');
                                }
                            } else {
                                setStatus('failed');
                                setMessage('Payment verification failed.');
                            }
                        } else {
                            setStatus('failed');
                            setMessage('Missing payment information from Khalti.');
                        }
                        return;
                    }
                }

                // ── REGULAR (NON-GROUP) PAYMENT FLOW ──
                // Auto-detect eSewa if data parameter exists (eSewa appends this)
                if (data || method === 'esewa') {
                    if (esewaStatus === 'failure') {
                        setStatus('failed');
                        setMessage('Payment was cancelled or failed. No order was created.');
                        return;
                    }

                    if (data) {
                        setMessage('Verifying eSewa payment and creating your order...');
                        console.log('Verifying eSewa with data:', data);
                        const response = await verifyEsewaPayment(data);
                        console.log('eSewa verification response:', response);

                        if (response.data?.success) {
                            setStatus('success');
                            setMessage('Payment successful! Your order has been placed.');
                            setOrderId(response.data.data.orderId);
                        } else {
                            setStatus('failed');
                            setMessage(response.error || 'Payment verification failed. Please contact support.');
                        }
                    } else {
                        setStatus('failed');
                        setMessage('No payment data received from eSewa.');
                    }
                } else if (pidx || method === 'khalti') {
                    if (pidx && pendingId) {
                        setMessage('Verifying Khalti payment and creating your order...');
                        const response = await verifyKhaltiPayment(pidx, pendingId);
                        console.log('Khalti verification response:', response);

                        if (response.data?.success) {
                            setStatus('success');
                            setMessage('Payment successful! Your order has been placed.');
                            setOrderId(response.data.data.orderId);
                        } else {
                            setStatus('failed');
                            setMessage('Payment verification failed. Please contact support.');
                        }
                    } else {
                        setStatus('failed');
                        setMessage('Missing payment information from Khalti.');
                    }
                } else {
                    setStatus('failed');
                    setMessage('Unknown payment method.');
                }
            } catch (error: unknown) {
                console.error('Payment verification error:', error);
                setStatus('failed');
                const err = error as { response?: { data?: { message?: string } } };
                setMessage(err.response?.data?.message || 'Failed to verify payment. Please contact support.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    const handleContinue = () => {
        if (status === 'success' && orderId) {
            router.push(`/order-tracking/${orderId}`);
        } else if (status === 'success' && groupCartId) {
            router.push(`/group-cart/${groupCartId}`);
        } else {
            router.push('/browse-restaurants');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-16 h-16">
                            <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
                        </div>
                    </div>

                    {/* Status Icon */}
                    <div className="mb-6">
                        {status === 'verifying' && (
                            <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <h2 className={`text-2xl font-bold mb-2 ${status === 'success' ? 'text-green-600' :
                        status === 'failed' ? 'text-red-600' : 'text-gray-800'
                        }`}>
                        {status === 'verifying'
                            ? 'Processing Payment'
                            : status === 'success'
                                ? (orderId ? 'Order Placed Successfully!' : 'Payment Successful!')
                                : 'Payment Failed'}
                    </h2>
                    <p className="text-gray-500 mb-8">{message}</p>

                    {/* Action Button */}
                    {status !== 'verifying' && (
                        <button
                            onClick={handleContinue}
                            className={`w-full py-4 rounded-xl font-semibold text-white transition ${status === 'success'
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                        >
                            {status === 'success' && orderId
                                ? 'Track Your Order'
                                : status === 'success' && groupCartId
                                    ? 'Back to Group Cart'
                                    : 'Back to Restaurants'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        }>
            <PaymentCallbackContent />
        </Suspense>
    );
}
