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

export default function EarningsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        setTimeout(() => setLoading(false), 500);
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
                        <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>
                        <p className="text-gray-500">Track your income and payouts</p>
                    </div>
                </div>

                {/* Total Earnings Card */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
                    <p className="text-green-100 mb-2">Total Earnings</p>
                    <p className="text-5xl font-bold">Rs. 0</p>
                    <div className="flex items-center gap-2 mt-4 text-green-200">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">+0% from last week</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">Today</p>
                            <Banknote className="w-5 h-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. 0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Week</p>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. 0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-sm">This Month</p>
                            <Wallet className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">Rs. 0</p>
                    </div>
                </div>

                {/* Payout Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Payout History</h3>
                        <button className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>

                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-400 text-lg">No payouts yet</p>
                        <p className="text-gray-300 text-sm mt-1">Payouts are processed weekly</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
