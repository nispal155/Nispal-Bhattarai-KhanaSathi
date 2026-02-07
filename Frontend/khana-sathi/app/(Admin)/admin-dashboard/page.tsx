"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { getAllOrders } from "@/lib/orderService";
import { getOverviewStats } from "@/lib/analyticsService";
import type { Order } from "@/lib/orderService";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setStatsError("");
      const statsRes = await getOverviewStats(30);
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setStatsError(statsRes?.error || "Failed to load stats");
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStatsError("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      setOrdersError("");
      const ordersRes = await getAllOrders({ limit: 10, page: 1 });
      if (ordersRes.data?.success) {
        setRecentOrders(ordersRes.data.data);
      } else {
        setOrdersError(ordersRes.error || "Failed to load orders");
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrdersError("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);
  return (

    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />




      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100 flex items-center justify-center bg-gray-100">
            <Image
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`}
              alt="Admin"
              width={48}
              height={48}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=random`;
              }}
            />
          </div>
        </header>
        <div className="p-8">
          {/* Key Metrics */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Key Metrics</h3>
              {(statsError || ordersError) && (
                <button
                  onClick={() => { fetchStats(); fetchOrders(); }}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              )}
            </div>
            {loadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : statsError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 mb-2">{statsError}</p>
                <button
                  onClick={fetchStats}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900">{stats?.totalOrders?.value ?? 0}</p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                <p className="text-4xl font-bold text-gray-900">NPR {stats?.totalRevenue?.value?.toLocaleString() ?? 0}</p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Active Restaurants</p>
                <p className="text-4xl font-bold text-gray-900">{stats?.activeRestaurants?.value ?? 0}</p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Active Delivery Staff</p>
                <p className="text-4xl font-bold text-gray-900">{stats?.activeStaff?.value ?? 0}</p>
              </div>
            </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Orders</h3>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ORDER ID</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">CUSTOMER</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">RESTAURANT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">AMOUNT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">STATUS</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10">
                          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                        </td>
                      </tr>
                    ) : ordersError ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10">
                          <p className="text-red-500 mb-2">{ordersError}</p>
                          <button onClick={fetchOrders} className="text-sm text-red-500 hover:text-red-700 font-medium">
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">No recent orders</td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-6 py-5 font-medium text-blue-600">#{order.orderNumber}</td>
                        <td className="px-6 py-5 text-gray-900">{order.customer?.username || '—'}</td>
                        <td className="px-6 py-5 text-gray-900">{order.restaurant?.name || '—'}</td>
                        <td className="px-6 py-5 font-semibold text-gray-900">NPR {order.pricing?.total?.toLocaleString() || '—'}</td>

                        <td className="px-6 py-5">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => router.push(`/orders`)}
                              className="text-gray-600 hover:text-blue-600"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-6">
            <button onClick={() => router.push("/add-restaurants")}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium shadow-md transition"
            >
              Add Restaurant
            </button>

            <button className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transition transform hover:scale-105">
              Add Staff
            </button>
          </div>


        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>

    </div>
  );
}