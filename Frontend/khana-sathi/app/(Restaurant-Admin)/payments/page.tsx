'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    Clock,
    CheckCircle,
    Loader2,
    Download,
    Calendar,
    DollarSign
} from 'lucide-react';
import RestaurantSidebar from '@/components/RestaurantSidebar';
import { getRestaurantOrders } from '@/lib/orderService';

interface Settlement {
    _id: string;
    period: string;
    totalOrders: number;
    grossAmount: number;
    commission: number;
    netAmount: number;
    status: 'pending' | 'processing' | 'completed';
    paidAt?: string;
}

export default function PaymentsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [stats, setStats] = useState({
        pendingAmount: 0,
        lastPayout: 0,
        totalEarnings: 0,
        thisMonth: 0
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchPaymentData();
    }, [user, router, authLoading]);

    const fetchPaymentData = async () => {
        try {
            setLoading(true);
            const response = await getRestaurantOrders();
            const orders = (response.data as any)?.data || [];

            // Filter completed orders
            const completedOrders = orders.filter((o: any) => o.status === 'delivered');
            
            // Calculate total earnings (all time)
            const totalEarnings = completedOrders.reduce((sum: number, o: any) => {
                const orderTotal = o.pricing?.total || 0;
                const commission = orderTotal * 0.15; // 15% commission
                return sum + (orderTotal - commission);
            }, 0);

            // Calculate this month earnings
            const thisMonthStart = new Date();
            thisMonthStart.setDate(1);
            thisMonthStart.setHours(0, 0, 0, 0);
            
            const thisMonthOrders = completedOrders.filter((o: any) => new Date(o.createdAt) >= thisMonthStart);
            const thisMonth = thisMonthOrders.reduce((sum: number, o: any) => {
                const orderTotal = o.pricing?.total || 0;
                const commission = orderTotal * 0.15;
                return sum + (orderTotal - commission);
            }, 0);

            // Pending amount: COD orders that are delivered but not yet settled
            const pendingOrders = completedOrders.filter((o: any) => 
                o.paymentMethod === 'cod' && o.paymentStatus !== 'settled'
            );
            const pendingAmount = pendingOrders.reduce((sum: number, o: any) => {
                const orderTotal = o.pricing?.total || 0;
                const commission = orderTotal * 0.15;
                return sum + (orderTotal - commission);
            }, 0);

            setStats({
                pendingAmount: Math.round(pendingAmount),
                lastPayout: 0, // Would need actual payout records
                totalEarnings: Math.round(totalEarnings),
                thisMonth: Math.round(thisMonth)
            });

            // Generate weekly settlements from order data
            const weeklySettlements: Settlement[] = [];
            const weekMap = new Map<string, { orders: any[], grossAmount: number }>();

            completedOrders.forEach((order: any) => {
                const orderDate = new Date(order.createdAt);
                const weekStart = new Date(orderDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                const periodKey = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                
                const existing = weekMap.get(periodKey) || { orders: [], grossAmount: 0 };
                weekMap.set(periodKey, {
                    orders: [...existing.orders, order],
                    grossAmount: existing.grossAmount + (order.pricing?.total || 0)
                });
            });

            weekMap.forEach((data, period) => {
                const commission = Math.round(data.grossAmount * 0.15);
                weeklySettlements.push({
                    _id: period,
                    period,
                    totalOrders: data.orders.length,
                    grossAmount: Math.round(data.grossAmount),
                    commission,
                    netAmount: Math.round(data.grossAmount - commission),
                    status: 'completed' // Simplified
                });
            });

            // Sort by period (most recent first)
            weeklySettlements.sort((a, b) => {
                const dateA = new Date(a.period.split(' - ')[0]);
                const dateB = new Date(b.period.split(' - ')[0]);
                return dateB.getTime() - dateA.getTime();
            });

            setSettlements(weeklySettlements.slice(0, 10)); // Last 10 weeks
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <RestaurantSidebar />
            <div className="flex-1 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Payments & Settlements</h1>
                            <p className="text-gray-500">Track your earnings and payouts</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                            <Download className="w-5 h-5 text-gray-600" />
                            Export Statement
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Pending Settlement</p>
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">Rs. {stats.pendingAmount}</p>
                                    <p className="text-xs text-yellow-600 mt-2">Will be settled soon</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Last Payout</p>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">Rs. {stats.lastPayout}</p>
                                    <p className="text-xs text-gray-400 mt-2">-</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">This Month</p>
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">Rs. {stats.thisMonth}</p>
                                    <p className="text-xs text-gray-400 mt-2">Current period</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Total Earnings</p>
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">Rs. {stats.totalEarnings}</p>
                                    <p className="text-xs text-green-500 mt-2">All time</p>
                                </div>
                            </div>

                            {/* Settlements Table */}
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-orange-500" />
                                    Settlement History
                                </h3>

                                {settlements.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <DollarSign className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-800 mb-2">No Settlements Yet</h4>
                                        <p className="text-gray-500 max-w-md mx-auto">
                                            Your settlement history will appear here once you start receiving orders.
                                            Settlements are processed weekly.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Orders</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Gross</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Commission</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Net Amount</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {settlements.map((settlement) => (
                                                    <tr key={settlement._id} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="py-4 px-4 font-medium text-gray-800">{settlement.period}</td>
                                                        <td className="py-4 px-4 text-gray-600">{settlement.totalOrders}</td>
                                                        <td className="py-4 px-4 text-gray-600">Rs. {settlement.grossAmount}</td>
                                                        <td className="py-4 px-4 text-red-500">- Rs. {settlement.commission}</td>
                                                        <td className="py-4 px-4 font-bold text-green-600">Rs. {settlement.netAmount}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${settlement.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                settlement.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Payment Info */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Settlements are processed weekly. Commission rate is 15% on all orders.
                                    For payment-related queries, please contact support.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
