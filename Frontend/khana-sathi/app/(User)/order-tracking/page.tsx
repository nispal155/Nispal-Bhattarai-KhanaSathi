"use client";

import Link from "next/link";
import { Clock, Loader2, LogIn, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyOrders } from "@/lib/orderService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    name: string;
  };
  status: string;
  pricing: {
    total: number;
  };
  createdAt: string;
}

export default function OrdersListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated]);

  const fetchOrders = async (showToast = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyOrders();
      console.log("Orders API response:", response);

      if (response.error) {
        setError(response.error);
        setOrders([]);
        if (showToast) toast.error(response.error);
        return;
      }

      const ordersData = response?.data?.data || response?.data || [];
      console.log("Parsed orders data:", ordersData);
      const ordersList = Array.isArray(ordersData) ? ordersData : [];
      setOrders(ordersList);
      if (showToast) {
        toast.success(`Found ${ordersList.length} order(s)`);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
      if (showToast) toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true;
    if (filter === "active") return !["delivered", "cancelled"].includes(order.status);
    if (filter === "completed") return order.status === "delivered";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🍜</span>
                </div>
                <div>
                  <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
                </div>
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please login to view your orders and track deliveries.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Login to Continue
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-red-500 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍜</span>
              </div>
              <div>
                <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/user-profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>👤</span> Profile
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center">
              <span className="text-pink-600 text-lg">👤</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <button
            onClick={() => fetchOrders(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button
              onClick={() => fetchOrders(true)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {["all", "active", "completed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${filter === f
                ? "bg-red-500 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-gray-500 mb-4">
              {filter === "all" ? "You haven't placed any orders yet" : `No ${filter} orders found`}
            </p>
            <Link
              href="/browse-restaurants"
              className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link
                key={order._id}
                href={`/order-tracking/${order._id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{order.restaurant?.name || "Restaurant"}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-medium">Rs. {order.pricing?.total || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}

    </div>
  );
}
