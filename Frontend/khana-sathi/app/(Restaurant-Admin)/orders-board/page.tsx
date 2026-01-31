"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Home, UtensilsCrossed, ClipboardList, Star, Tag, FileText, Users, MessageCircle, Package, Settings, LogOut, Loader2 } from "lucide-react";
import { getRestaurantOrders, updateOrderStatus } from "@/lib/orderService";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    username: string;
  };
  items: OrderItem[];
  status: string;
  deliveryAddress?: {
    addressLine1: string;
    city: string;
  };
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getRestaurantOrders();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const ordersData = responseData?.data || responseData || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const getItemsString = (items: OrderItem[]) => {
    return items.map(item => `${item.quantity}x ${item.name}`).join(", ");
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  };

  // Filter orders by status
  const newOrders = orders.filter(o => o.status === "pending" || o.status === "confirmed");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  const outForDelivery = orders.filter(o => o.status === "picked_up" || o.status === "on_the_way");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} className="object-contain" />
            <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
          </div>

          <nav className="space-y-2">
            <a href="/RM-Dashboard" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Home className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/menu" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <UtensilsCrossed className="w-5 h-5" />
              Menu
            </a>
            <a href="/orders-board" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <ClipboardList className="w-5 h-5" />
              Orders Board
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Star className="w-5 h-5" />
              Reviews
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Tag className="w-5 h-5" />
              Offers
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <FileText className="w-5 h-5" />
              Analytics
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Users className="w-5 h-5" />
              Staff
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <span className="text-2xl font-bold">रु</span>
              Payments
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <MessageCircle className="w-5 h-5" />
              Chat
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Package className="w-5 h-5" />
              Group Orders
            </a>
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-5 h-5" />
            Log Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Live Orders Board</h1>
            <p className="text-gray-600 mt-2">Manage current orders awaiting action.</p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/owner-avatar.jpg" alt="Owner" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* New Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                New Orders <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{newOrders.length}</span>
              </h3>
              <div className="space-y-6">
                {newOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No new orders</p>
                ) : (
                newOrders.map((order) => (
                  <div key={order._id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">#{order.orderNumber} • {order.customer?.username || "Customer"}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery • {getTimeSince(order.createdAt)} ago
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">{order.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {getItemsString(order.items)}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(order._id, "preparing")}
                        disabled={updating === order._id}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {updating === order._id ? "Updating..." : "Start Preparing"}
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Preparing */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Preparing <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">{preparingOrders.length}</span>
              </h3>
              <div className="space-y-6">
                {preparingOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders preparing</p>
                ) : (
                preparingOrders.map((order) => (
                  <div key={order._id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">#{order.orderNumber} • {order.customer?.username || "Customer"}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery • {getTimeSince(order.createdAt)} ago
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Preparing</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {getItemsString(order.items)}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(order._id, "ready")}
                        disabled={updating === order._id}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {updating === order._id ? "Updating..." : "Mark Ready"}
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Ready */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Ready for Pickup/Delivery <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{readyOrders.length}</span>
              </h3>
              <div className="space-y-6">
                {readyOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders ready</p>
                ) : (
                readyOrders.map((order) => (
                  <div key={order._id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">#{order.orderNumber} • {order.customer?.username || "Customer"}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery • {getTimeSince(order.createdAt)} ago
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Ready</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {getItemsString(order.items)}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(order._id, "picked_up")}
                        disabled={updating === order._id}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {updating === order._id ? "Updating..." : "Out for Delivery"}
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Out for Delivery */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Out for Delivery <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">{outForDelivery.length}</span>
              </h3>
              <div className="space-y-6">
                {outForDelivery.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders out for delivery</p>
                ) : (
                outForDelivery.map((order) => (
                  <div key={order._id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">#{order.orderNumber} • {order.customer?.username || "Customer"}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery • {getTimeSince(order.createdAt)} ago
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">{order.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {getItemsString(order.items)}</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(order._id, "delivered")}
                        disabled={updating === order._id}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {updating === order._id ? "Updating..." : "Mark Delivered"}
                      </button>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}