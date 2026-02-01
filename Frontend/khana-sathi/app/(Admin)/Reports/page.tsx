"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Eye, Calendar, Download, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOverviewStats, getTopRestaurants } from "@/lib/analyticsService";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/formatters";

export default function Reports() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<any>(null);
  const [topRestaurants, setTopRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, restaurantsRes] = await Promise.all([
        getOverviewStats(days),
        getTopRestaurants(days)
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (restaurantsRes.success) setTopRestaurants(restaurantsRes.data);
    } catch (error) {
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, suffix = "", isCurrency = false }: any) => (
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
            </>
          )}
        </div>

        <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16 bg-white">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>
    </div>
  );
}