'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Package,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';

export default function MyDeliveriesPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<any[]>([]);

    useEffect(() => {
        if (authLoading) return; // Wait for auth to load

        if (!user) {
            router.push('/login');
            return;
        }
        // Simulate fetching deliveries
        setTimeout(() => {
            setDeliveries([]);
            setLoading(false);
        }, 500);
    }, [user, router, authLoading]);

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
                        Active Deliveries
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
                            {deliveries.map((delivery, index) => (
                                <div key={index} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <MapPin className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{delivery.restaurant}</p>
                                                <p className="text-sm text-gray-500">{delivery.address}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                            In Progress
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500">Today</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500">This Week</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">0</p>
                        <p className="text-xs text-gray-500">Total</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
