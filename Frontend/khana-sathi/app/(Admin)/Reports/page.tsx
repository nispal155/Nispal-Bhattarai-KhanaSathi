"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Eye, Download, Loader2, TrendingUp, TrendingDown, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOverviewStats, getTopRestaurants, getForecasting, getSettlements, getRoutePerformance } from "@/lib/analyticsService";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/formatters";

interface MetricWithChange {
  value: number;
  change?: number;
}

interface OverviewStats {
  totalOrders: MetricWithChange;
  totalRevenue: MetricWithChange;
  avgOrderValue: MetricWithChange;
  activeStaff: MetricWithChange;
  activeRestaurants?: MetricWithChange;
}

interface TopRestaurant {
  _id: string;
  name: string;
  totalSales: number;
  orderCount: number;
}

interface ForecastEntry {
  date: string;
  predictedSales: number;
}

interface SettlementInvoice {
  _id: string;
  count: number;
  totalAmount: number;
}

interface SettlementData {
  invoices: SettlementInvoice[];
  unbilledSales: number;
}

interface RouteRider {
  _id: string;
  name: string;
  deliveries: number;
  averageDuration: number;
  averageRating: number;
}

interface RoutePerformanceData {
  activeDeliveries: number;
  readyForPickup: number;
  liveTrackedOrders: number;
  averageDeliveryMinutes: number;
  delayedDeliveries: number;
  topRiders: RouteRider[];
}

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  suffix?: string;
  isCurrency?: boolean;
}

export default function Reports() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, restaurantsRes, forecastRes, settlementsRes, routePerformanceRes] = await Promise.all([
        getOverviewStats(days),
        getTopRestaurants(days),
        getForecasting(),
        getSettlements(),
        getRoutePerformance()
      ]);

      if (statsRes.success) setStats((statsRes.data as OverviewStats) || null);
      if (restaurantsRes.success) setTopRestaurants((restaurantsRes.data as TopRestaurant[]) || []);
      if (forecastRes.success) {
        setForecast(((forecastRes.data as { forecast?: ForecastEntry[] } | undefined)?.forecast) || []);
      }
      if (settlementsRes.success) setSettlement((settlementsRes.data as SettlementData) || null);
      if (routePerformanceRes.success) setRoutePerformance((routePerformanceRes.data as RoutePerformanceData) || null);
    } catch {
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const StatCard = ({ title, value, change, suffix = "", isCurrency = false }: StatCardProps) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <p className="text-gray-600 mb-2">{title}</p>
      <p className="text-4xl font-bold text-gray-900">
        {isCurrency ? formatCurrency(value) : value}{suffix}
      </p>
      {change !== undefined && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(Math.round(change))}% {change >= 0 ? '↑' : '↓'} from previous period</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-3xl font-bold text-gray-900">Business Reports</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100 flex items-center justify-center bg-gray-100">
            <Image
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`}
              alt="Admin"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
        </header>

        <div className="p-8">
          {/* Filter & Export */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
              <p className="text-gray-500">Analytics for the last {days} days</p>
            </div>
            <div className="flex gap-4">
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="px-5 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition cursor-pointer outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
              <button className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-sm">
                <Download className="w-5 h-5" />
                <span className="font-medium">Export CSV</span>
              </button>
            </div>
          </div>

          {loading && !stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                  title="Total Orders"
                  value={stats?.totalOrders?.value || 0}
                  change={stats?.totalOrders?.change}
                />
                <StatCard
                  title="Total Sales"
                  value={stats?.totalRevenue?.value || 0}
                  change={stats?.totalRevenue?.change}
                  isCurrency={true}
                />
                <StatCard
                  title="Avg. Order Value"
                  value={stats?.avgOrderValue?.value || 0}
                  suffix=""
                  isCurrency={true}
                />
                <StatCard
                  title="Active Delivery Staff"
                  value={stats?.activeStaff?.value || 0}
                  suffix=""
                />
              </div>

              <div className="mb-10">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Performing Restaurants</h3>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Restaurant</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Total Sales</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase">Orders</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topRestaurants.length > 0 ? (
                          topRestaurants.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-5 font-medium text-gray-900">{item.name}</td>
                              <td className="px-6 py-5 text-gray-900">{formatCurrency(item.totalSales)}</td>
                              <td className="px-6 py-5 text-gray-600">{item.orderCount}</td>
                              <td className="px-6 py-5 text-right">
                                <button className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition">
                                  <Eye className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                              No restaurant data available for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Forecasting */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">Sales Forecasting (Next 7 Days)</h3>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-4">
                    {forecast.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">
                          {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-bold text-blue-600">{formatCurrency(item.predictedSales)}</span>
                      </div>
                    ))}
                    {forecast.length === 0 && (
                      <p className="text-center text-gray-400 py-10">Not enough data to generate forecast</p>
                    )}
                  </div>
                </div>

                {/* Settlements */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">Financial Settlements</h3>
                    <Download className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 font-bold text-center">
                      <p className="text-yellow-600 text-xs uppercase tracking-wider mb-1">Unbilled Sales (Pending)</p>
                      <p className="text-3xl text-yellow-700">{formatCurrency(settlement?.unbilledSales || 0)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {settlement?.invoices?.map((inv) => (
                        <div key={inv._id} className={`p-4 rounded-xl border ${inv._id === 'paid' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                          <p className={`text-xs uppercase font-bold ${inv._id === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{inv._id}</p>
                          <p className="text-xl font-bold">{formatCurrency(inv.totalAmount)}</p>
                          <p className="text-xs text-gray-500">{inv.count} Invoices</p>
                        </div>
                      ))}
                    </div>

                    <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg">
                      Manage Settlements
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Delivery Route Performance</h3>
                      <p className="text-sm text-gray-500">Live delivery flow and performance trends from the last 7 days.</p>
                    </div>
                    <Navigation className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Active Deliveries", value: routePerformance?.activeDeliveries || 0 },
                      { label: "Ready For Pickup", value: routePerformance?.readyForPickup || 0 },
                      { label: "Live Tracked Orders", value: routePerformance?.liveTrackedOrders || 0 },
                      { label: "Avg Delivery Time", value: `${routePerformance?.averageDeliveryMinutes || 0} min` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Delayed deliveries in the last 7 days: <span className="font-bold">{routePerformance?.delayedDeliveries || 0}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">Top Riders</h3>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-4">
                    {(routePerformance?.topRiders || []).map((rider) => (
                      <div key={rider._id} className="rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{rider.name}</p>
                            <p className="text-sm text-gray-500">
                              {rider.deliveries} deliveries • Avg. {rider.averageDuration} min
                            </p>
                          </div>
                          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                            {Number(rider.averageRating || 0).toFixed(1)}★
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!routePerformance?.topRiders || routePerformance.topRiders.length === 0) && (
                      <p className="py-6 text-center text-gray-400">No rider analytics available yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16 bg-white">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>
    </div >
  );
}
