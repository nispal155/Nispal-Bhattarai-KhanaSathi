"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Home, UtensilsCrossed, ClipboardList, Star, Tag, Users,
  MessageCircle, Package, Settings, LogOut, FileText, User,
  Wallet, Loader2, Bell, Clipboard
} from "lucide-react";
import { getRestaurantOrders } from '@/lib/orderService';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";

export default function OwnerDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    ordersInQueue: 0,
    pendingSettlements: 0,
    totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const ordersResponse = await getRestaurantOrders();
      const orders = (ordersResponse.data as any)?.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today);
      const inQueue = orders.filter((o: any) => ['pending', 'confirmed', 'preparing'].includes(o.status));
      const todaySales = todayOrders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.pricing?.total || 0), 0);

      const pendingSettlements = orders
        .filter((o: any) => o.status === 'delivered' && o.paymentMethod === 'cod')
        .reduce((sum: number, o: any) => {
          const orderTotal = o.pricing?.total || 0;
          const commission = orderTotal * 0.15;
          return sum + (orderTotal - commission);
        }, 0);

      setStats({
        todaySales,
        ordersInQueue: inQueue.length,
        pendingSettlements: Math.round(pendingSettlements),
        totalOrders: orders.length
      });

      setRecentOrders(orders.slice(0, 4));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'preparing': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'picked_up':
      case 'on_the_way': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
        <p className="text-gray-500">Here's your restaurant overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2">Today's Sales</p>
              <p className="text-3xl font-bold text-gray-900">NPR {stats.todaySales.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2">From completed orders</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2">Orders in Queue</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ordersInQueue}</p>
              <p className="text-sm text-blue-600 mt-2">Awaiting action</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500 mt-2">All time</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <p className="text-gray-600 mb-2">Pending Settlements</p>
              <p className="text-3xl font-bold text-gray-900">NPR {stats.pendingSettlements}</p>
              <p className="text-sm text-orange-600 mt-2">To be processed</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end gap-4 mb-8">
            <Link href="/add-menu" className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition">
              + Add Menu Item
            </Link>
            <Link href="/offers" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Create Offer
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Recent Orders</h3>
              <Link href="/orders-board" className="text-red-500 hover:text-red-600 font-medium font-bold">View All Board →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No orders yet</p>
                <p className="text-gray-300 text-sm">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.items?.length || 0} items • NPR {order.pricing?.total || 0}</p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium capitalize ${getStatusStyle(order.status)}`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-12">
        © 2025 Khana Sathi Admin. All rights reserved.
      </footer>
    </div>
  );
}