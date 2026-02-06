'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Clock,
    Loader2,
    BarChart3,
    ChefHat,
    Calendar
} from 'lucide-react';
import { getRestaurantOrders } from '@/lib/orderService';
import RestaurantSidebar from '@/components/RestaurantSidebar';

interface DailyStat {
    date: string;
    orders: number;
    revenue: number;
}

interface TopDish {
    name: string;
    quantity: number;
    revenue: number;
}

interface HourlyData {
    hour: string;
    orders: number;
}

export default function AnalyticsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7' | '30'>('7');
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        completedOrders: 0
    });
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [topDishes, setTopDishes] = useState<TopDish[]>([]);
    const [peakHours, setPeakHours] = useState<HourlyData[]>([]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        fetchAnalytics();
    }, [user, router, authLoading, period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await getRestaurantOrders();
            const orders = (response.data as any)?.data || [];

            // Calculate date range
            const now = new Date();
            const daysAgo = new Date(now);
            daysAgo.setDate(daysAgo.getDate() - parseInt(period));

            const filteredOrders = orders.filter((o: any) => new Date(o.createdAt) >= daysAgo);
            const completedOrders = filteredOrders.filter((o: any) => o.status === 'delivered');

            // Calculate stats
            const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);
            setStats({
                totalOrders: filteredOrders.length,
                totalRevenue,
                avgOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
                completedOrders: completedOrders.length
            });

            // Calculate daily stats
            const dailyMap = new Map<string, { orders: number; revenue: number }>();
            for (let i = 0; i < parseInt(period); i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dailyMap.set(dateStr, { orders: 0, revenue: 0 });
            }

            filteredOrders.forEach((order: any) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const existing = dailyMap.get(dateStr) || { orders: 0, revenue: 0 };
                dailyMap.set(dateStr, {
                    orders: existing.orders + 1,
                    revenue: existing.revenue + (order.status === 'delivered' ? (order.pricing?.total || 0) : 0)
                });
            });

            setDailyStats(Array.from(dailyMap.entries()).map(([date, data]) => ({
                date,
                orders: data.orders,
                revenue: data.revenue
            })).reverse());

            // Calculate top dishes
            const dishMap = new Map<string, { quantity: number; revenue: number }>();
            completedOrders.forEach((order: any) => {
                order.items?.forEach((item: any) => {
                    const name = item.menuItem?.name || item.name || 'Unknown';
                    const existing = dishMap.get(name) || { quantity: 0, revenue: 0 };
                    dishMap.set(name, {
                        quantity: existing.quantity + (item.quantity || 1),
                        revenue: existing.revenue + (item.price * (item.quantity || 1))
                    });
                });
            });

            const sortedDishes = Array.from(dishMap.entries())
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
            setTopDishes(sortedDishes);

            // Calculate peak hours
            const hourMap = new Map<number, number>();
            for (let i = 0; i < 24; i++) hourMap.set(i, 0);

            filteredOrders.forEach((order: any) => {
                const hour = new Date(order.createdAt).getHours();
                hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
            });

            const peakData = Array.from(hourMap.entries())
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([hour, orders]) => ({
                    hour: `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'}`,
                    orders
                }));
            setPeakHours(peakData);

        } catch (error) {
            console.error("Error fetching analytics:", error);
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

    const maxRevenue = Math.max(...dailyStats.map(d => d.revenue), 1);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <RestaurantSidebar />
            <div className="flex-1 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                            <p className="text-gray-500">Track your restaurant performance</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPeriod('7')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${period === '7' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                7 Days
                            </button>
                            <button
                                onClick={() => setPeriod('30')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${period === '30' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                                30 Days
                            </button>
                        </div>
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
                                        <p className="text-gray-500 text-sm">Total Revenue</p>
                                        <DollarSign className="w-5 h-5 text-green-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">NPR {stats.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Total Orders</p>
                                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Completed</p>
                                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">{stats.completedOrders}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-gray-500 text-sm">Avg Order Value</p>
                                        <BarChart3 className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <p className="text-3xl font-bold text-gray-800">NPR {stats.avgOrderValue}</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                {/* Daily Revenue Chart */}
                                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-orange-500" />
                                        Daily Revenue
                                    </h3>
                                    {dailyStats.length > 0 ? (
                                        <div className="space-y-3">
                                            {dailyStats.slice(-7).map((day, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <span className="text-sm text-gray-500 w-16">{day.date}</span>
                                                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                                                            style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 w-24 text-right">
                                                        NPR {day.revenue.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">No data available</div>
                                    )}
                                </div>

                                {/* Top Dishes */}
                                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <ChefHat className="w-5 h-5 text-orange-500" />
                                        Top Selling Dishes
                                    </h3>
                                    {topDishes.length > 0 ? (
                                        <div className="space-y-4">
                                            {topDishes.map((dish, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                                        }`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{dish.name}</p>
                                                        <p className="text-sm text-gray-500">{dish.quantity} orders</p>
                                                    </div>
                                                    <p className="font-bold text-green-600">NPR {dish.revenue.toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">No dishes sold yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Peak Hours */}
                            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    Peak Order Times
                                </h3>
                                {peakHours.length > 0 ? (
                                    <div className="flex items-end gap-4 h-40">
                                        {peakHours.map((hour, idx) => (
                                            <div key={idx} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-gradient-to-t from-orange-400 to-red-500 rounded-t-lg transition-all"
                                                    style={{ height: `${(hour.orders / Math.max(...peakHours.map(h => h.orders))) * 100}%`, minHeight: '20px' }}
                                                />
                                                <p className="text-xs text-gray-500 mt-2">{hour.hour}</p>
                                                <p className="text-xs font-medium text-gray-700">{hour.orders}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">No order data available</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
