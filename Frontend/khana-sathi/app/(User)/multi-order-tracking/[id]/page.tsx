"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MessageSquare, MapPin, Clock, Loader2, ChevronRight, CheckCircle2, Circle, Package } from "lucide-react";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { getMultiOrderTracking, getMultiOrderStatusText, getMultiOrderStatusColor } from "@/lib/multiOrderService";
import { cancelMultiOrder } from "@/lib/multiOrderService";
import type { MultiOrderTrackingData, SubOrderTracking } from "@/lib/multiOrderService";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5003";

// Multi-order status steps
const multiOrderStatusSteps = [
    { id: 1, status: "pending", title: "Order Placed", description: "Waiting for restaurants" },
    { id: 2, status: "partially_confirmed", title: "Confirming", description: "Restaurants are confirming" },
    { id: 3, status: "all_confirmed", title: "All Confirmed", description: "All restaurants confirmed" },
    { id: 4, status: "preparing", title: "Preparing", description: "Restaurants are preparing" },
    { id: 5, status: "all_ready", title: "All Ready", description: "Ready for pickup" },
    { id: 6, status: "picking_up", title: "Picking Up", description: "Rider collecting orders" },
    { id: 7, status: "picked_up", title: "Picked Up", description: "All orders collected" },
    { id: 8, status: "on_the_way", title: "On the Way", description: "Heading to you" },
    { id: 9, status: "delivered", title: "Delivered", description: "Enjoy your meal!" },
];

function getMultiOrderStepNumber(status: string): number {
    const step = multiOrderStatusSteps.find(s => s.status === status);
    return step?.id || 1;
}

// Sub-order status steps
const subOrderStatusSteps = [
    { status: "pending", title: "Pending" },
    { status: "confirmed", title: "Confirmed" },
    { status: "preparing", title: "Preparing" },
    { status: "ready", title: "Ready" },
    { status: "picked_up", title: "Picked Up" },
];

function getSubOrderStepNumber(status: string): number {
    const idx = subOrderStatusSteps.findIndex(s => s.status === status);
    return idx >= 0 ? idx + 1 : 1;
}

export default function MultiOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: multiOrderId } = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [tracking, setTracking] = useState<MultiOrderTrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchTracking();

            // Connect to socket for real-time updates
            const newSocket = io(SOCKET_URL, {
                transports: ["websocket", "polling"],
                auth: { token: localStorage.getItem("token") }
            });
            setSocket(newSocket);

            newSocket.on("connect", () => {
                newSocket.emit("joinOrder", multiOrderId);
            });

            newSocket.on("orderStatusUpdate", (data) => {
                console.log("Multi-order update received:", data);
                fetchTracking();
            });

            // Polling as fallback
            const interval = setInterval(fetchTracking, 60000);

            return () => {
                clearInterval(interval);
                newSocket.emit("leave", multiOrderId);
                newSocket.disconnect();
            };
        }
    }, [authLoading, isAuthenticated, multiOrderId]);

    const fetchTracking = async () => {
        try {
            setLoading(true);
            const response = await getMultiOrderTracking(multiOrderId);
            if (response.error) {
                setError(response.error);
                return;
            }
            setTracking(response.data?.data || null);
        } catch (err) {
            console.error("Error fetching multi-order tracking:", err);
            setError("Failed to load tracking data");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to cancel this entire order?")) return;

        try {
            setCancelling(true);
            const response = await cancelMultiOrder(multiOrderId, "Customer requested cancellation");
            if (response.error) {
                toast.error(response.error);
                return;
            }
            toast.success("Order cancelled successfully");
            fetchTracking();
        } catch (err) {
            toast.error("Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <UserHeader />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Please login to view order tracking</p>
                        <Link href="/login" className="bg-red-500 text-white px-6 py-2 rounded-lg">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !tracking) {
        return (
            <div className="min-h-screen bg-gray-50">
                <UserHeader />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || "Order not found"}</p>
                        <Link href="/order-tracking" className="text-red-500 underline">
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentStep = getMultiOrderStepNumber(tracking.overallStatus);
    const isCancellable = ["pending", "partially_confirmed"].includes(tracking.overallStatus);

    return (
        <div className="min-h-screen bg-gray-50">
            <UserHeader />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Multi-Restaurant Order</h1>
                        <p className="text-gray-500">Order #{tracking.orderNumber}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getMultiOrderStatusColor(tracking.overallStatus as any)}`}>
                        {getMultiOrderStatusText(tracking.overallStatus as any)}
                    </span>
                </div>

                {/* Overall Status Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Order Progress</h2>
                    <div className="relative">
                        <div className="flex justify-between items-center">
                            {multiOrderStatusSteps.slice(0, 5).map((step, idx) => {
                                const isCompleted = currentStep > step.id;
                                const isCurrent = currentStep === step.id;
                                return (
                                    <div key={step.id} className="flex flex-col items-center flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-red-500' : 'bg-gray-200'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : (
                                                <Circle className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                                            )}
                                        </div>
                                        <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-red-500' : 'text-gray-500'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Progress line */}
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" style={{ width: 'calc(100% - 2rem)', marginLeft: '1rem' }}>
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${Math.min((currentStep - 1) / 4 * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sub-Orders - Individual Restaurant Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Restaurant Orders ({tracking.restaurantCount})
                    </h2>

                    <div className="space-y-4">
                        {tracking.subOrders.map((subOrder, idx) => {
                            const subStep = getSubOrderStepNumber(subOrder.status);
                            return (
                                <div key={subOrder._id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {subOrder.restaurant.logoUrl ? (
                                                <Image
                                                    src={subOrder.restaurant.logoUrl}
                                                    alt={subOrder.restaurant.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-lg">🍽️</span>
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-medium">{subOrder.restaurant.name}</h3>
                                                <p className="text-sm text-gray-500">Order #{subOrder.orderNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {subOrder.isPickedUp ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Picked Up</span>
                                            ) : subOrder.isReady ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Ready</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                                                    {subOrder.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini status timeline for sub-order */}
                                    <div className="flex items-center gap-1 mt-2">
                                        {subOrderStatusSteps.map((step, stepIdx) => {
                                            const isCompleted = subStep > stepIdx + 1;
                                            const isCurrent = subStep === stepIdx + 1;
                                            return (
                                                <div key={step.status} className="flex items-center flex-1">
                                                    <div className={`h-1.5 flex-1 rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-red-500' : 'bg-gray-200'
                                                        }`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rider Info */}
                {tracking.rider && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Your Delivery Rider</h2>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {tracking.rider.profilePicture ? (
                                    <Image
                                        src={tracking.rider.profilePicture}
                                        alt={tracking.rider.username}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xl">🏍️</span>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium">{tracking.rider.username}</p>
                                    {tracking.rider.vehicleDetails && (
                                        <p className="text-sm text-gray-500">
                                            {tracking.rider.vehicleDetails.model} • {tracking.rider.vehicleDetails.licensePlate}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {tracking.rider.phone && (
                                    <a
                                        href={`tel:${tracking.rider.phone}`}
                                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                    >
                                        <Phone className="w-5 h-5" />
                                    </a>
                                )}
                                <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Address */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-500" />
                        Delivery Address
                    </h2>
                    <p className="text-gray-700">{tracking.deliveryAddress.addressLine1}</p>
                    {tracking.deliveryAddress.addressLine2 && (
                        <p className="text-gray-500 text-sm">{tracking.deliveryAddress.addressLine2}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                        {tracking.deliveryAddress.city}
                        {tracking.deliveryAddress.zipCode && `, ${tracking.deliveryAddress.zipCode}`}
                    </p>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span>Rs. {tracking.pricing.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Delivery Fee ({tracking.restaurantCount} restaurants)</span>
                            <span>Rs. {tracking.pricing.deliveryFee}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Service Fee</span>
                            <span>Rs. {tracking.pricing.serviceFee}</span>
                        </div>
                        {tracking.pricing.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-Rs. {tracking.pricing.discount}</span>
                            </div>
                        )}
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold text-base">
                            <span>Total</span>
                            <span>Rs. {tracking.pricing.total}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        href="/order-tracking"
                        className="flex-1 py-3 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to Orders
                    </Link>
                    {isCancellable && (
                        <button
                            onClick={handleCancelOrder}
                            disabled={cancelling}
                            className="flex-1 py-3 text-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
