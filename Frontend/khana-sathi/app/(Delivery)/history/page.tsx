'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Loader2
} from 'lucide-react';

export default function HistoryPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        setTimeout(() => {
            setHistory([]);
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
                        <h1 className="text-2xl font-bold text-gray-800">Delivery History</h1>
                        <p className="text-gray-500">View your past deliveries</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4">
                    <select className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none">
                        <option>All Time</option>
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                    </select>
                    <select className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none">
                        <option>All Status</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                    </select>
                </div>

                {/* History List */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Past Deliveries
                    </h3>

                    {history.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No delivery history</p>
                            <p className="text-gray-300 text-sm mt-1">Your completed deliveries will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item, index) => (
                                <div key={index} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100' : 'bg-red-100'}`}>
                                            {item.status === 'completed' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{item.restaurant}</p>
                                            <p className="text-sm text-gray-500">{item.date}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-gray-800">Rs. {item.earnings}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
