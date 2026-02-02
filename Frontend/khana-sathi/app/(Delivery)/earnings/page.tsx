'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    Banknote,
    Calendar,
    Download,
    Loader2
} from 'lucide-react';
import { getRiderEarnings, EarningsData } from '@/lib/riderService';

export default function EarningsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<EarningsData | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        fetchEarnings();
    }, [user, router, authLoading]);

    const fetchEarnings = async () => {
        if (!user?._id) return;
        try {
            setLoading(true);
            const response = await getRiderEarnings(user._id);
            if (response.data?.data) {
                setEarnings(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching earnings:", error);
        } finally {
            setLoading(false);
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
                        <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>
                        <p className="text-gray-500">Track your income and payouts</p>
                    </div>
                </div>

                {/* Total Earnings Card */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
                    <p className="text-green-100 mb-2">Total Earnings</p>
                    <p className="text-5xl font-bold">Rs. {earnings?.total.earnings || 0}</p>
                    <div className="flex items-center gap-2 mt-4 text-green-200">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">{earnings?.total.deliveries || 0} total deliveries</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">Today</p>
                            <Banknote className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.today.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.today.deliveries || 0} deliveries</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Week</p>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.week.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.week.deliveries || 0} deliveries</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Month</p>
                            <Wallet className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. {earnings?.month.earnings || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">{earnings?.month.deliveries || 0} deliveries</p>
                    </div>
                </div>

                {/* Daily Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Daily Breakdown (Last 7 Days)</h3>
                        <button className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>

                    {earnings?.dailyBreakdown && earnings.dailyBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {earnings.dailyBreakdown.map((day, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        <p className="text-sm text-gray-500">{day.deliveries} deliveries</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">Rs. {day.earnings}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-lg">No earnings data yet</p>
                            <p className="text-gray-300 text-sm mt-1">Complete deliveries to see your earnings</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
