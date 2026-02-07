"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2, MessageSquare, User, Star, Bike, Calendar, Download, Search, FileText, X, ChevronRight, Phone, MapPin, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useChat } from "@/context/ChatContext";
import toast from "react-hot-toast";

import { getRestaurantOrders, updateOrderStatus, assignRider } from "@/lib/orderService";
import { getAvailableRiders, AvailableRider } from "@/lib/riderService";

interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    username: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
    menuItem?: string;
  }>;
  status: string;
  deliveryAddress?: {
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    zipCode?: string;
  };
  deliveryRider?: {
    _id: string;
    username: string;
  };
  pricing?: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  specialInstructions?: string;
  createdAt: string;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [availableRiders, setAvailableRiders] = useState<AvailableRider[]>([]);
  const [selectedOrderForRider, setSelectedOrderForRider] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [assigningRider, setAssigningRider] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Date filters for history
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { user: authUser } = useAuth();
  const { socket, joinRoom, onOrderUpdate, onNotification } = useSocket();
  const { openChat } = useChat();

  useEffect(() => {
    fetchOrders();

    if (!socket || !authUser?._id) return;

    joinRoom(authUser._id);

    const unsubscribeNotification = onNotification((data: { type: string; message?: string }) => {
      if (data.type === "order_status" || data.type === "chat_message") {
        fetchOrders();
        if (data.type === "order_status") {
          toast.success(data.message || "New order update!", { icon: "🔔" });
        }
      }
    });

    const unsubscribeOrderUpdate = onOrderUpdate(() => {
      fetchOrders();
    });

    const interval = setInterval(fetchOrders, 30000);

    return () => {
      clearInterval(interval);
      unsubscribeNotification();
      unsubscribeOrderUpdate();
    };
  }, [authUser, socket, joinRoom, onNotification, onOrderUpdate]);

  const fetchOrders = async () => {
    try {
      const response = await getRestaurantOrders({ status: 'active' });
      const responseData = response?.data as any;
      const ordersData = responseData?.data || responseData || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await getRestaurantOrders({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      const responseData = response?.data as any;
      const ordersData = responseData?.data || responseData || [];
      setHistoryOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) fetchHistory();
  }, [dateRange.startDate, dateRange.endDate]);

  const fetchAvailableRiders = async () => {
    try {
      const response = await getAvailableRiders();
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

  const getItemsString = (items: Array<{ name: string; quantity: number }>) => {
    return items.map(item => `${item.quantity}x ${item.name}`).join(", ");
  };

  const exportToCSV = () => {
    if (historyOrders.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      setExporting(true);
      const headers = ["Order ID", "Date", "Customer", "Phone", "Items", "Total", "Payment", "Status"];
      const rows = historyOrders.map(order => [
        order.orderNumber,
        new Date(order.createdAt).toLocaleString(),
        order.customer?.username || "N/A",
        order.customer?.phone || "N/A",
        order.items.map(i => `${i.quantity}x ${i.name}`).join("; "),
        order.pricing?.total || 0,
        order.paymentMethod?.toUpperCase() || "COD",
        order.status.toUpperCase()
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `khana-sathi-orders-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Orders exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export orders");
    } finally {
      setExporting(false);
    }
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

  const handleOpenChat = (order: Order) => {
    openChat({
      orderId: order._id,
      recipientName: order.customer?.username || "Customer",
      recipientRole: "customer",
      chatThread: "customer-restaurant"
    });
  };

  const newOrders = orders.filter(o => o.status === "pending" || o.status === "confirmed");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  const outForDelivery = orders.filter(o => o.status === "picked_up" || o.status === "on_the_way");

  return (
    <div className="p-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Orders Board</h1>
          <p className="text-gray-500">Manage current orders awaiting action.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            <p className="text-gray-500 font-medium">Loading orders...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Active Orders Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {[
              { title: "New Orders", color: "blue", count: newOrders.length, items: newOrders, action: "Confirm", nextStatus: "preparing" },
              { title: "Preparing", color: "yellow", count: preparingOrders.length, items: preparingOrders, action: "Mark Ready", nextStatus: "ready" },
              { title: "Ready", color: "green", count: readyOrders.length, items: readyOrders, action: "Out for Delivery", nextStatus: "picked_up" },
              { title: "On the Way", color: "purple", count: outForDelivery.length, items: outForDelivery, action: "Delivered", nextStatus: "delivered" }
            ].map((col) => (
              <div key={col.title} className="flex flex-col h-full">
                <div className={`flex items-center justify-between mb-4 p-3 border-b-2 border-${col.color}-500`}>
                  <h3 className="font-bold text-gray-800 text-sm">{col.title}</h3>
                  <span className={`bg-${col.color}-100 text-${col.color}-700 px-2.5 py-0.5 rounded-full text-xs font-bold`}>{col.count}</span>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                  {col.items.length === 0 ? (
                    <div className="p-8 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                      <FileText className="w-6 h-6 mb-2 opacity-30" />
                      <p className="text-xs font-medium uppercase tracking-wider">Empty</p>
                    </div>
                  ) : col.items.map((order) => (
                    <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div onClick={() => setSelectedOrderDetails(order)} className="cursor-pointer">
                          <p className="font-bold text-gray-900 group-hover:text-red-600 transition">#{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-500">
                            {getTimeSince(order.createdAt)} ago
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenChat(order)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-800 mb-1">{order.customer?.username || "Guest Customer"}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{getItemsString(order.items)}</p>
                      </div>

                      {col.title === "Ready" && !order.deliveryRider && (
                        <div className="mb-4">
                          <button
                            onClick={() => openRiderSelection(order._id)}
                            className="w-full py-2 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-100 hover:bg-red-100 transition"
                          >
                            Assign Rider
                          </button>
                        </div>
                      )}

                      {order.deliveryRider && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 rounded-lg text-blue-700">
                          <Bike className="w-3.5 h-3.5" />
                          <p className="text-[10px] font-semibold">{order.deliveryRider.username}</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleStatusUpdate(order._id, col.nextStatus)}
                        disabled={updating === order._id || (col.title === "Ready" && !order.deliveryRider)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${updating === order._id || (col.title === "Ready" && !order.deliveryRider)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : `bg-gray-900 text-white hover:bg-red-600`
                          }`}
                      >
                        {updating === order._id ? "Updating..." : col.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order History Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-12">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                <p className="text-sm text-gray-500">View and export past orders.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm text-gray-700 bg-transparent outline-none"
                  />
                  <span className="text-gray-300">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm text-gray-700 bg-transparent outline-none"
                  />
                </div>

                <button
                  onClick={exportToCSV}
                  disabled={exporting || historyOrders.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order No.</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Loading history...</p>
                      </td>
                    </tr>
                  ) : historyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">No results found for this range.</td>
                    </tr>
                  ) : historyOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition cursor-pointer group" onClick={() => setSelectedOrderDetails(order)}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{order.customer?.username || "Guest"}</p>
                        <p className="text-[10px] text-gray-500">{order.customer?.phone || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        {order.deliveryRider ? (
                          <div className="flex items-center gap-1.5 text-blue-600 font-medium text-xs">
                            <Bike className="w-3.5 h-3.5" /> {order.deliveryRider.username}
                          </div>
                        ) : <span className="text-[10px] text-gray-300 italic">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase px-2 py-0.5 bg-gray-100 rounded">
                          {order.paymentMethod || "COD"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">Rs. {order.pricing?.total || 0}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Rider Modal */}
      {selectedOrderForRider && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Assign Rider</h3>
                <p className="text-sm text-gray-500">Pick an available rider for delivery.</p>
              </div>
              <button
                onClick={() => setSelectedOrderForRider(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {availableRiders.length > 0 ? availableRiders.map(rider => (
                <button
                  key={rider._id}
                  onClick={() => handleAssignRider(selectedOrderForRider, rider._id)}
                  disabled={assigningRider}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-gray-100 shadow-sm text-gray-300">
                      {rider.profilePicture ? (
                        <Image src={rider.profilePicture} alt={rider.username} width={40} height={40} className="object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{rider.username}</p>
                      <p className="text-[10px] text-gray-400">{rider.completedOrders || 0} deliveries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-[10px] font-bold text-yellow-700">{rider.averageRating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </button>
              )) : (
                <div className="text-center py-8">
                  <Bike className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium text-gray-400">No riders available right now.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[4px] flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">#{selectedOrderDetails.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Items & Summary */}
                <div className="space-y-6">
                  <section>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Items Ordered</h4>
                    <div className="space-y-2">
                      {selectedOrderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-[11px] font-bold text-gray-800 border border-gray-200">
                              {item.quantity}
                            </span>
                            <p className="text-sm font-medium text-gray-800">{item.name}</p>
                          </div>
                          {item.price && <p className="text-xs font-bold text-gray-900">Rs. {item.price * item.quantity}</p>}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Summary</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>Subtotal</span>
                        <span>Rs. {selectedOrderDetails.pricing?.subtotal || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>Delivery Fee</span>
                        <span>Rs. {selectedOrderDetails.pricing?.deliveryFee || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-600">
                        <span>Service Fee</span>
                        <span>Rs. {selectedOrderDetails.pricing?.serviceFee || 0}</span>
                      </div>
                      {selectedOrderDetails.pricing?.discount ? (
                        <div className="flex justify-between text-xs font-semibold text-red-500">
                          <span>Discount</span>
                          <span>- Rs. {selectedOrderDetails.pricing.discount}</span>
                        </div>
                      ) : null}
                      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-red-600">Rs. {selectedOrderDetails.pricing?.total || 0}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Delivery Info */}
                <div className="space-y-6">
                  <section>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Info</h4>
                    <div className="bg-white border text-gray-300 border-gray-100 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Customer</p>
                          <p className="text-sm font-bold text-gray-800">{selectedOrderDetails.customer?.username || "Guest"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium">Phone</p>
                          <p className="text-sm font-bold text-gray-800">{selectedOrderDetails.customer?.phone || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-medium">Address</p>
                          <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                            {selectedOrderDetails.deliveryAddress?.addressLine1}
                            {selectedOrderDetails.deliveryAddress?.addressLine2 ? `, ${selectedOrderDetails.deliveryAddress.addressLine2}` : ""}
                            <br />
                            {selectedOrderDetails.deliveryAddress?.city}{selectedOrderDetails.deliveryAddress?.zipCode ? ` - ${selectedOrderDetails.deliveryAddress.zipCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 uppercase">
                        {selectedOrderDetails.paymentMethod || "COD"} - {selectedOrderDetails.paymentStatus || "UNPAID"}
                      </div>
                      <div className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase ${selectedOrderDetails.status === 'delivered' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        {selectedOrderDetails.status}
                      </div>
                    </div>
                  </section>

                  {selectedOrderDetails.specialInstructions && (
                    <section className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-amber-700">
                        <FileText className="w-3.5 h-3.5" />
                        <h4 className="text-[11px] font-bold uppercase">Customer Note</h4>
                      </div>
                      <p className="text-xs italic text-amber-800 font-medium">
                        "{selectedOrderDetails.specialInstructions}"
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <p className="text-[10px] text-gray-400 font-medium">Ordered on {new Date(selectedOrderDetails.createdAt).toLocaleString()}</p>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-8 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}