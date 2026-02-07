'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import {
    ArrowLeft,
    Package,
    MapPin,
    Loader2,
    Navigation,
    Phone,
    MessageSquare
} from 'lucide-react';
import { getRiderOrders, updateDeliveryStatus } from '@/lib/orderService';
import { getRiderEarnings } from '@/lib/riderService';
import ChatWindow from '@/components/Chat/ChatWindow';
import type { ChatThread } from '@/lib/chatService';

interface Order {
    _id: string;
    orderNumber: string;
    restaurant: {
        name: string;
        address?: {
            addressLine1?: string;
            city?: string;
        };
    };
    customer: {
        username: string;
    };
    deliveryAddress: {
        addressLine1: string;
        city: string;
    };
    status: string;
    pricing: {
        total: number;
    };
    items: Array<{ name: string; quantity: number }>;
}

type ChatRecipient = { orderId: string; name: string; role: 'customer' | 'restaurant'; thread: ChatThread } | null;

export default function MyDeliveriesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { onOrderUpdate, onRiderAssigned } = useSocket();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<Order[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);
    const [chatRecipient, setChatRecipient] = useState<ChatRecipient>(null);
    const [deliveryCounts, setDeliveryCounts] = useState({ today: 0, week: 0, total: 0 });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        fetchDeliveries();
        fetchDeliveryCounts();

        // Listen for real-time order assignments (personal room)
        const unsubscribeRider = onRiderAssigned((data: any) => {
            console.log("[Socket] Rider assigned event received on deliveries:", data);
            fetchDeliveries();
        });

        // Listen for order updates (order rooms - though we might not be in them yet)
        const unsubscribeOrder = onOrderUpdate((data: any) => {
            console.log("[Socket] Order update received on my-deliveries:", data);
            fetchDeliveries();
        });

        return () => {
            unsubscribeRider();
            unsubscribeOrder();
        };
    }, [user, router, authLoading, onRiderAssigned, onOrderUpdate]);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const response = await getRiderOrders('active');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const responseData = response?.data as any;
            const ordersData = responseData?.data || responseData || [];
            setDeliveries(Array.isArray(ordersData) ? ordersData : []);
        } catch (err) {
            console.error("Error fetching deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryCounts = async () => {
        if (!user?._id) return;
        try {
            const response = await getRiderEarnings(user._id);
            const data = (response?.data as any)?.data;
            if (data) {
                setDeliveryCounts({
                    today: data.today?.deliveries || 0,
                    week: data.week?.deliveries || 0,
                    total: data.total?.deliveries || 0,
                });
            }
        } catch (err) {
            console.error('Error fetching delivery counts:', err);
        }
    };

    const handleMarkOnTheWay = async (orderId: string) => {
        try {
            setUpdating(orderId);
            await updateDeliveryStatus(orderId, 'on_the_way');
            await fetchDeliveries();
        } catch (err) {
            console.error("Error updating status:", err);
        } finally {
            setUpdating(null);
        }
    };

    const handleMarkDelivered = async (orderId: string) => {
        try {
            setUpdating(orderId);
            await updateDeliveryStatus(orderId, 'delivered');
            await fetchDeliveries();
        } catch (err) {
            console.error("Error updating status:", err);
        } finally {
            setUpdating(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/rider-dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Deliveries</h1>
                        <p className="text-gray-500">View and manage your active deliveries</p>
                    </div>
                </div>

                {/* Active Deliveries */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-orange-500" />
                        Active Deliveries ({deliveries.length})
                    </h3>

                    {deliveries.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No active deliveries</p>
                            <p className="text-gray-300 text-sm mt-1">New orders will appear here when assigned</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deliveries.map((delivery) => (
                                <div key={delivery._id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <Package className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">Order #{delivery.orderNumber}</p>
                                                <p className="text-sm text-gray-500">{delivery.restaurant?.name}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${delivery.status === 'on_the_way'
                                            ? 'bg-blue-100 text-blue-700'
                                            : delivery.status === 'picked_up'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                            {delivery.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="ml-6 pl-9 border-l-2 border-gray-100">
                                        <div className="flex items-start gap-2 mb-2">
                                            <MapPin className="w-4 h-4 text-red-500 mt-1" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Deliver to: {delivery.customer?.username}</p>
                                                <p className="text-sm text-gray-500">{delivery.deliveryAddress?.addressLine1}, {delivery.deliveryAddress?.city}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Items: {delivery.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">Total: Rs. {delivery.pricing?.total}</p>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        {delivery.status === 'picked_up' && (
                                            <button
                                                onClick={() => handleMarkOnTheWay(delivery._id)}
                                                disabled={updating === delivery._id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                {updating === delivery._id ? 'Updating...' : 'Start Delivery'}
                                            </button>
                                        )}
                                        {delivery.status === 'on_the_way' && (
                                            <button
                                                onClick={() => handleMarkDelivered(delivery._id)}
                                                disabled={updating === delivery._id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition disabled:opacity-50"
                                            >
                                                <Package className="w-4 h-4" />
                                                {updating === delivery._id ? 'Updating...' : 'Mark Delivered'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setChatRecipient({
                                                orderId: delivery._id,
                                                name: delivery.customer?.username || 'Customer',
                                                role: 'customer',
                                                thread: 'customer-rider'
                                            })}
                                            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 px-4 rounded-lg font-medium transition"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Chat
                                        </button>
                                        <button className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition">
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">{deliveryCounts.today}</p>
                        <p className="text-xs text-gray-500">Today</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">{deliveryCounts.week}</p>
                        <p className="text-xs text-gray-500">This Week</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">{deliveryCounts.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            {user && chatRecipient && (
                <ChatWindow
                    orderId={chatRecipient.orderId}
                    recipientName={chatRecipient.name}
                    recipientRole={chatRecipient.role}
                    chatThread={chatRecipient.thread}
                    onClose={() => setChatRecipient(null)}
                />
            )}
        </div>
    );
}
