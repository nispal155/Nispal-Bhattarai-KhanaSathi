"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2, MessageSquare, User, Star, Bike } from "lucide-react";
import { getRestaurantOrders, updateOrderStatus, assignRider } from "@/lib/orderService";
import { getAvailableRiders, AvailableRider } from "@/lib/riderService";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useAuth } from "@/context/AuthContext";

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
  deliveryRider?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [availableRiders, setAvailableRiders] = useState<AvailableRider[]>([]);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState<string | null>(null);
  const [assigningRider, setAssigningRider] = useState(false);
  const { user: authUser } = useAuth();

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

  const fetchAvailableRiders = async () => {
    try {
      const response = await getAvailableRiders();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const ridersData = responseData?.data || [];
      setAvailableRiders(Array.isArray(ridersData) ? ridersData : []);
    } catch (err) {
      console.error("Error fetching riders:", err);
    }
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      setAssigningRider(true);
      await assignRider(orderId, riderId);
      await fetchOrders();
      setSelectedOrderForRider(null);
    } catch (err) {
      console.error("Error assigning rider:", err);
    } finally {
      setAssigningRider(false);
    }
  };

  const openRiderSelection = async (orderId: string) => {
    setSelectedOrderForRider(orderId);
    await fetchAvailableRiders();
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
      <RestaurantSidebar />

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
                          <button
                            onClick={() => setActiveChatOrderId(order._id)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            title="Chat with Customer"
                          >
                            <MessageSquare className="w-5 h-5" />
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
                          <button
                            onClick={() => setActiveChatOrderId(order._id)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            title="Chat with Customer"
                          >
                            <MessageSquare className="w-5 h-5" />
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
                        <p className="text-sm text-gray-700 mb-2">Items: {getItemsString(order.items)}</p>
                        
                        {/* Rider Assignment Section */}
                        {order.deliveryRider ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <Bike className="w-4 h-4" />
                              Assigned to: <span className="font-semibold">{order.deliveryRider.username}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="mb-4">
                            {selectedOrderForRider === order._id ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Select a Delivery Rider:
                                </p>
                                {availableRiders.length === 0 ? (
                                  <p className="text-sm text-gray-600">No riders available right now</p>
                                ) : (
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {availableRiders.map((rider) => (
                                      <button
                                        key={rider._id}
                                        onClick={() => handleAssignRider(order._id, rider._id)}
                                        disabled={assigningRider}
                                        className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition disabled:opacity-50"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {rider.profilePicture ? (
                                              <Image src={rider.profilePicture} alt={rider.username} width={32} height={32} className="object-cover" />
                                            ) : (
                                              <User className="w-4 h-4 text-gray-500" />
                                            )}
                                          </div>
                                          <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">{rider.username}</p>
                                            <p className="text-xs text-gray-500">{rider.completedOrders} deliveries</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                          <Star className="w-3 h-3 fill-yellow-400" />
                                          <span className="text-xs font-medium">{rider.averageRating?.toFixed(1) || "N/A"}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <button
                                  onClick={() => setSelectedOrderForRider(null)}
                                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => openRiderSelection(order._id)}
                                className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition flex items-center justify-center gap-2"
                              >
                                <Bike className="w-4 h-4" />
                                Assign Delivery Rider
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleStatusUpdate(order._id, "picked_up")}
                            disabled={updating === order._id || !order.deliveryRider}
                            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!order.deliveryRider ? "Assign a rider first" : ""}
                          >
                            {updating === order._id ? "Updating..." : "Out for Delivery"}
                          </button>
                          <button
                            onClick={() => setActiveChatOrderId(order._id)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            title="Chat with Customer"
                          >
                            <MessageSquare className="w-5 h-5" />
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
                          <button
                            onClick={() => setActiveChatOrderId(order._id)}
                            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            title="Chat with Customer"
                          >
                            <MessageSquare className="w-5 h-5" />
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

      {/* Chat Window */}
      {authUser && activeChatOrderId && (
        <ChatWindow
          orderId={activeChatOrderId}
          recipientName={orders.find(o => o._id === activeChatOrderId)?.customer?.username || "Customer"}
          recipientRole="customer"
          onClose={() => setActiveChatOrderId(null)}
        />
      )}
    </div>
  );
}