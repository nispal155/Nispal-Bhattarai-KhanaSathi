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

    const handleExport = () => {
        if (settlements.length === 0) {
            alert('No settlement data to export');
            return;
        }
        const headers = ['Period', 'Total Orders', 'Gross Amount (Rs.)', 'Commission (Rs.)', 'Net Amount (Rs.)', 'Status'];
        const rows = settlements.map(s => [
            s.period,
            s.totalOrders,
            s.grossAmount,
            s.commission,
            s.netAmount,
            s.status.charAt(0).toUpperCase() + s.status.slice(1)
        ]);
        const csv = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');
        const summaryLine = `\nSummary,,,\nPending Settlement,Rs. ${stats.pendingAmount},,\nThis Month,Rs. ${stats.thisMonth},,\nTotal Earnings,Rs. ${stats.totalEarnings},,`;
        const blob = new Blob([csv + summaryLine], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `settlement-statement-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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

            const completedOrders = orders.filter((o: any) => o.status === 'delivered');

            const totalEarnings = completedOrders.reduce((sum: number, o: any) => {
                const orderTotal = o.pricing?.total || 0;
                const commission = orderTotal * 0.15;
                return sum + (orderTotal - commission);
            }, 0);

            const thisMonthStart = new Date();
            thisMonthStart.setDate(1);
            thisMonthStart.setHours(0, 0, 0, 0);

            const thisMonthOrders = completedOrders.filter((o: any) => new Date(o.createdAt) >= thisMonthStart);
            const thisMonth = thisMonthOrders.reduce((sum: number, o: any) => {
                const orderTotal = o.pricing?.total || 0;
                const commission = orderTotal * 0.15;
                return sum + (orderTotal - commission);
            }, 0);

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
                lastPayout: 0,
                totalEarnings: Math.round(totalEarnings),
                thisMonth: Math.round(thisMonth)
            });

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
                    status: 'completed'
                });
            });

            weeklySettlements.sort((a, b) => {
                const dateA = new Date(a.period.split(' - ')[0]);
                const dateB = new Date(b.period.split(' - ')[0]);
                return dateB.getTime() - dateA.getTime();
            });

            setSettlements(weeklySettlements.slice(0, 10));
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Payments & Earnings</h1>
                        <p className="text-gray-500">Track your settlements and financial performance</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Download className="w-5 h-5" />
                        Download Report
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                                    <Clock className="w-5 h-5 text-yellow-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">In Pipeline</p>
                                <p className="text-2xl font-black text-gray-800">Rs. {stats.pendingAmount.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-yellow-600 mt-1 uppercase">Pending Settlement</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">This Month</p>
                                <p className="text-2xl font-black text-gray-800">Rs. {stats.thisMonth.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Feb 2026</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Last Payout</p>
                                <p className="text-2xl font-black text-gray-800">Rs. {stats.lastPayout.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-green-600 mt-1 uppercase">Successfully Paid</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Earned</p>
                                <p className="text-2xl font-black text-gray-800">Rs. {stats.totalEarnings.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase">All-time Revenue</p>
                            </div>
                        </div>

                        {/* Settlement History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-orange-500" />
                                    Settlement History
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">15% Commission Applied</span>
                            </div>

                            {settlements.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <DollarSign className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 mb-1">No Payout Records</h4>
                                    <p className="text-gray-400 text-sm max-w-sm mx-auto">Once your orders are delivered and settled, they will appear here as weekly statements.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="text-left py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Period</th>
                                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Count</th>
                                                <th className="text-right py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Sale</th>
                                                <th className="text-right py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</th>
                                                <th className="text-right py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Net</th>
                                                <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {settlements.map((settlement) => (
                                                <tr key={settlement._id} className="hover:bg-gray-50/50 transition">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                            <span className="font-bold text-gray-800 text-sm">{settlement.period}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-600">{settlement.totalOrders}</td>
                                                    <td className="py-4 px-6 text-right text-sm font-semibold text-gray-600">Rs. {settlement.grossAmount.toLocaleString()}</td>
                                                    <td className="py-4 px-6 text-right text-sm font-bold text-red-500">-{settlement.commission.toLocaleString()}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-sm font-black text-green-600">Rs. {settlement.netAmount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${settlement.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {settlement.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Alert / Info */}
                        <div className="mt-8 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-orange-800">Payment Policy & Auto-Settlements</h4>
                                <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                    KhanaSathi platform fee of 15% is automatically deducted from the gross order amount. Settlements are calculated every Sunday and credited to your verified bank account within 2-3 business days. COD orders are cleared through your weekly balance.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
