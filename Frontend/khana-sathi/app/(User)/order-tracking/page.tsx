"use client";

import Link from "next/link";
import { Clock, Loader2, LogIn, RefreshCw, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMyOrders } from "@/lib/orderService";
import { getMyMultiOrders, getMultiOrderStatusText, getMultiOrderStatusColor } from "@/lib/multiOrderService";
import type { MultiOrder } from "@/lib/multiOrderService";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
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
  isSubOrder?: boolean;
  multiOrder?: string;
}

interface DisplayOrder {
  _id: string;
  orderNumber: string;
  displayName: string;
  status: string;
  total: number;
  createdAt: string;
  isMultiOrder: boolean;
  restaurantCount?: number;
}

export default function OrdersListPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [displayOrders, setDisplayOrders] = useState<DisplayOrder[]>([]);
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

      // Fetch both regular orders and multi-orders
      const [ordersResponse, multiOrdersResponse] = await Promise.all([
        getMyOrders(),
        getMyMultiOrders()
      ]);

      const allDisplayOrders: DisplayOrder[] = [];

      // Process regular orders (exclude sub-orders as they'll be in multi-orders)
      if (!ordersResponse.error) {
        const ordersData = ordersResponse?.data?.data || ordersResponse?.data || [];
        const ordersList = Array.isArray(ordersData) ? ordersData : [] as Order[];

        ordersList.forEach((order: Order) => {
          // Skip sub-orders (they're shown inside multi-orders)
          if (!order.isSubOrder) {
            allDisplayOrders.push({
              _id: order._id,
              orderNumber: order.orderNumber,
              displayName: order.restaurant?.name || "Restaurant",
              status: order.status,
              total: order.pricing?.total || 0,
              createdAt: order.createdAt,
              isMultiOrder: false
            });
          }
        });
      }

      // Process multi-orders
      if (!multiOrdersResponse.error) {
        const multiOrdersData = multiOrdersResponse?.data?.data || multiOrdersResponse?.data || [];
        const multiOrdersList = Array.isArray(multiOrdersData) ? multiOrdersData : [] as MultiOrder[];

        multiOrdersList.forEach((mo: MultiOrder) => {
          allDisplayOrders.push({
            _id: mo._id,
            orderNumber: mo.orderNumber,
            displayName: `${mo.restaurantCount} Restaurants`,
            status: mo.status,
            total: mo.pricing?.total || 0,
            createdAt: mo.createdAt,
            isMultiOrder: true,
            restaurantCount: mo.restaurantCount
          });
        });
      }

      // Sort by creation date (newest first)
      allDisplayOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setDisplayOrders(allDisplayOrders);
      if (showToast) {
        toast.success(`Found ${allDisplayOrders.length} order(s)`);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
      if (showToast) toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = displayOrders.filter(order => {
    if (filter === "all") return true;
    if (filter === "active") return !["delivered", "cancelled"].includes(order.status);
    if (filter === "completed") return order.status === "delivered";
    if (filter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: string, isMultiOrder: boolean) => {
    if (isMultiOrder) {
      return getMultiOrderStatusColor(status as any);
    }
    switch (status) {
      case "delivered": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  const getStatusText = (status: string, isMultiOrder: boolean) => {
    if (isMultiOrder) {
      return getMultiOrderStatusText(status as any);
    }
    return status.replace("_", " ");
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
        <UserHeader />

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
      <UserHeader />

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
                href={order.isMultiOrder ? `/multi-order-tracking/${order._id}` : `/order-tracking/${order._id}`}
                className={`block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${order.isMultiOrder ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-white' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {order.isMultiOrder && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full">
                        <Layers className="w-4 h-4 text-purple-600" />
                      </span>
                    )}
                    <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full capitalize ${getStatusColor(order.status, order.isMultiOrder)}`}>
                    {getStatusText(order.status, order.isMultiOrder)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {order.isMultiOrder ? (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {order.displayName}
                    </span>
                  ) : (
                    order.displayName
                  )}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="font-medium">Rs. {order.total}</span>
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
