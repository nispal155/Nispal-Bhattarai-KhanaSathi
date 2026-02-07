'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Home,
  Package,
  Clock,
  Wallet,
  Star,
  Settings,
  LogOut,
  User,
  Loader2,
  AlertTriangle,
  Navigation,
  Layers,
  Map,
  MapPin,
  Bell,
  ChevronRight
} from 'lucide-react';
import { getRiderStats, RiderStats } from '@/lib/riderService';
import {
  triggerSOS,
  updateRiderLocation,
  getOrderPools
} from '@/lib/orderService';
import ChatWindow from '@/components/Chat/ChatWindow';
import { MessageSquare } from 'lucide-react';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api"}/auth`;

export default function RiderDashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState<RiderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [pools, setPools] = useState<any[]>([]);
  const [isSendingSOS, setIsSendingSOS] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();
    fetchPools();

    // Setup location tracking interval if order is active
    let locationInterval: NodeJS.Timeout;
    if (stats?.currentOrder && stats.currentOrder.status === 'on_the_way') {
      locationInterval = setInterval(() => {
        trackLocation(stats.currentOrder!._id);
      }, 30000); // Every 30 seconds
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [user, router, authLoading, stats?.currentOrder?._id]);

  const fetchStats = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await getRiderStats(user._id);
      if (response.data?.data) {
        setStats(response.data.data);
        setIsOnline(response.data.data.isOnline);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      const response = await getOrderPools();
      if (response.data?.success) {
        setPools(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pools:", error);
    }
  };

  const trackLocation = async (orderId: string) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await updateRiderLocation(
          orderId,
          position.coords.latitude,
          position.coords.longitude
        );
      } catch (err) {
        console.error("Location track error:", err);
      }
    });
  };

  const handleSOS = async (orderId: string) => {
    if (!window.confirm("ARE YOU SURE? This will alert emergency services and admins!")) return;

    setIsSendingSOS(true);
    try {
      await triggerSOS(orderId);
      toast.success("SOS SENT! Stay calm, help is coming.", {
        duration: 10000,
        icon: '🚨'
      });
    } catch (error) {
      toast.error("Failed to send SOS. Call emergency services directly!");
    } finally {
      setIsSendingSOS(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (user?._id) {
        await axios.post(`${API_URL}/logout`, { userId: user._id });
      }
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      logout();
      toast.success("Logged out successfully");
      router.push('/login');
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5003/api'}/staff/toggle-status`, {
        userId: user?._id,
        isOnline: newStatus
      });
      setIsOnline(newStatus);
      toast.success(newStatus ? "You are now Online" : "You are now Offline");
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Failed to update status");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-xl flex flex-col h-screen sticky top-0">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="KhanaSathi"
              width={45}
              height={45}
              className="object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-orange-600">KhanaSathi</h1>
              <p className="text-xs text-gray-500">Rider Portal</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 mx-4 mt-4 rounded-2xl text-white" style={{ backgroundColor: "#F3274C" }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg">{user.username}</p>
              <p className="text-xs text-yellow-100 truncate max-w-[140px]">{user.email}</p>
            </div>
          </div>
          {/* Online Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm">Status</span>
            <button
              onClick={toggleOnlineStatus}
              className={`relative w-14 h-7 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isOnline ? 'left-8' : 'left-1'}`}></span>
            </button>
          </div>
          <p className={`text-xs mt-1 text-right ${isOnline ? 'text-green-200' : 'text-gray-200'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <a href="/rider-dashboard" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-xl font-medium">
            <Home className="w-5 h-5" />
            Dashboard
          </a>
          <a href="/my-deliveries" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Package className="w-5 h-5" />
            My Deliveries
          </a>
          <a href="/history" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Clock className="w-5 h-5" />
            History
          </a>
          <a href="/earnings" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Wallet className="w-5 h-5" />
            Earnings
          </a>
          <a href="/rider-reviews" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Star className="w-5 h-5" />
            Reviews
          </a>
          <a href="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <User className="w-5 h-5" />
            My Profile
          </a>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user.username}!</h2>
            <p className="text-gray-500 mt-1">Here's your delivery overview for today</p>
          </div>
          <button className="relative p-3 bg-white rounded-full shadow-md hover:shadow-lg transition">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Today's Deliveries</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.todayDeliveries || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Total: {stats?.totalDeliveries || 0} deliveries</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Today's Earnings</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">Rs. {stats?.todayEarnings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Total: Rs. {stats?.totalEarnings || 0}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Avg. Delivery Time</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">25 min</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-3">Excellent!</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Your Rating</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.avgRating || 5.0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex text-yellow-400 text-sm mt-3">{'★'.repeat(Math.round(stats?.avgRating || 5))}{'☆'.repeat(5 - Math.round(stats?.avgRating || 5))} ({stats?.reviewCount || 0} reviews)</div>
              </div>
            </div>

            {/* Current Assignment Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Current Assignment</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${stats?.currentOrder ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {stats?.currentOrder ? 'Active Order' : 'No Active Order'}
                </span>
              </div>

              {stats?.currentOrder ? (
                <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">Order #{stats.currentOrder.orderNumber}</p>
                      <p className="text-sm text-gray-600">{stats.currentOrder.restaurant.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                        {stats.currentOrder.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setActiveChatOrderId(stats.currentOrder!._id)}
                        className="p-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition border border-orange-100"
                        title="Chat with Customer/Restaurant"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Customer:</strong> {stats.currentOrder.customer.username}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/my-deliveries')}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105"
                    >
                      View Delivery Details
                    </button>
                    <button
                      onClick={() => handleSOS(stats.currentOrder!._id)}
                      disabled={isSendingSOS}
                      className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <AlertTriangle className="w-5 h-5" /> SOS
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-lg mb-2">No active delivery</p>
                  <p className="text-gray-300 text-sm mb-6">New orders will appear here when assigned</p>
                  <button
                    onClick={() => router.push('/my-deliveries')}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105"
                  >
                    Check for Orders
                  </button>
                </div>
              )}
            </div>

            {/* Order Pools Section */}
            {pools.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">Available Pools</h3>
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">NEW</span>
                  </div>
                  <p className="text-xs text-blue-600 flex items-center gap-1 cursor-pointer">
                    <Navigation className="w-3 h-3" /> Optimize Route
                  </p>
                </div>

                <div className="space-y-4">
                  {pools.map((pool) => (
                    <div key={pool._id._id} className="p-4 border border-blue-50 bg-blue-50/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-800">{pool._id.name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {pool.count} Orders Waiting
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {typeof pool._id.address === 'object'
                          ? `${pool._id.address?.addressLine1 || ''}, ${pool._id.address?.city || ''}`.replace(/^,\s*|,\s*$/g, '')
                          : pool._id.address || 'No address'}
                      </p>
                      <button
                        onClick={() => router.push('/my-deliveries')}
                        className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        Pick up all orders <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="/earnings" className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-green-600" />
                    <span className="font-medium text-gray-800">View Earnings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </a>
                <a href="/history" className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-800">Delivery History</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </a>
                <a href="/rider-reviews" className="p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-600" />
                    <span className="font-medium text-gray-800">My Reviews</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </a>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Chat Window */}
      {user && activeChatOrderId && stats?.currentOrder && (
        <ChatWindow
          orderId={activeChatOrderId}
          recipientName={stats.currentOrder.customer?.username || "Customer"}
          recipientRole="customer"
          chatThread="customer-rider"
          onClose={() => setActiveChatOrderId(null)}
        />
      )}
    </div>
  );
}