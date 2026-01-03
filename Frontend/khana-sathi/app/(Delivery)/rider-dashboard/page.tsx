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
  MapPin,
  Bell,
  ChevronRight,
  User
} from 'lucide-react';

const API_URL = "http://localhost:5003/api/auth";

export default function RiderDashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
    }
  }, [user, router, authLoading]);

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
      await axios.put('http://localhost:5003/api/staff/toggle-status', {
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
          <a href="/reviews" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Deliveries</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-3">+0% from yesterday</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Earnings</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">Rs. 0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Weekly payout</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Avg. Delivery Time</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">0 min</p>
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
                <p className="text-3xl font-bold text-gray-800 mt-1">5.0</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex text-yellow-400 text-sm mt-3">★★★★★</div>
          </div>
        </div>

        {/* Current Assignment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Current Assignment</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">No Active Order</span>
          </div>

          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No active delivery</p>
            <p className="text-gray-300 text-sm mb-6">New orders will appear here when assigned</p>
            <button className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-105">
              Check for Orders
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
            <a href="#" className="text-orange-500 text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="text-center py-8 text-gray-400">
            <p>No recent activity</p>
          </div>
        </div>
      </main>
    </div>
  );
}