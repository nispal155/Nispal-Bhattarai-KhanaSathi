"use client";

import Image from "next/image";
import { Home, UtensilsCrossed, ClipboardList, Star, Tag, Users, Banknote, MessageCircle, Package, Settings, LogOut, FileText, User } from "lucide-react";

export default function OwnerDashboard() {
  const stats = [
    { title: "Today's Sales", value: " NPR 2,850.75", change: "+8.2% vs. yesterday", color: "text-green-600" },
    { title: "Orders in Queue", value: "12", change: "+2 vs. 2 hours ago", icon: ClipboardList, color: "text-blue-600" },
    { title: "Top Dish (Daily)", value: "Spicy Beef Tacos", sub: "25 orders today", icon: UtensilsCrossed, color: "text-purple-600" },
    { title: "Pending Settlements", value: "NPR 420.00", sub: "3 payments pending", color: "text-red-600" },
  ];

  const activity = [
    { time: "11:45 AM", icon: "ready", text: "Order #8932 (Takeaway) marked as Ready for Pickup by Chef Maria." },
    { time: "11:30 AM", icon: "new", text: "New online order #8931 received for table 7. (Delivery)" },
    { time: "11:15 AM", icon: "prep", text: "Chef John started preparing order #8930 (Dine-in)." },
    { time: "10:50 AM", icon: "new", text: "Order #8929 (Delivery)" },
  ];

  const liveOrders = [
    { id: "#8932", customer: "Sophia L.", items: 3, amount: "3250", status: "ready" },
    { id: "#8931", customer: "David P.", items: 5, amount: "675", status: "new" },
    { id: "#8930", customer: "Emily R.", items: 2, amount: "240", status: "preparing" },
    { id: "#8929", customer: "John M.", items: 4, amount: "450", status: "out" },
  ];

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
            <a href="/RM-Dashboard" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <Home className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/menu" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <UtensilsCrossed className="w-5 h-5" />
              Menu
            </a>
            <a href="/orders-board" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
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
            <a href="/rm-profile" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <User className="w-5 h-5 text-yellow-600" />
              Profile
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
          <h1 className="text-4xl font-bold text-gray-900">Owner Dashboard</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/owner-avatar.jpg" alt="Owner" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <p className="text-gray-600 mb-3 flex items-center gap-2">

                  {stat.title}
                </p>
                <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                {stat.change && <p className="text-sm text-gray-600">{stat.change}</p>}
                {stat.sub && <p className="text-sm text-gray-600 mt-2">{stat.sub}</p>}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex justify-end gap-4 mb-8">
            <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg transition">
              + Add Menu Item
            </button>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Restaurant Status</span>
              <button className="relative inline-flex h-8 w-16 items-center rounded-full bg-red-500 transition">
                <span className="inline-block h-6 w-6 transform rounded-full bg-white translate-x-9" />
              </button>
            </div>
            <button className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Create Offer
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Activity Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Activity Timeline</h3>
              <div className="space-y-6">
                {activity.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-sm text-gray-500 whitespace-nowrap">{item.time}</span>
                    <div className="flex-1">
                      <p className="text-gray-900">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Orders</h3>
              <p className="text-gray-600 mb-6">Current orders awaiting action.</p>
              <div className="space-y-4">
                {liveOrders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{order.id} - {order.customer}</p>
                      <span className={`px-4 py-1 rounded-full text-sm font-medium ${order.status === "ready" ? "bg-green-100 text-green-700" :
                        order.status === "new" ? "bg-blue-100 text-blue-700" :
                          order.status === "preparing" ? "bg-yellow-100 text-yellow-700" :
                            "bg-purple-100 text-purple-700"
                        }`}>
                        {order.status === "ready" ? "Ready for Pickup" :
                          order.status === "new" ? "New Order" :
                            order.status === "preparing" ? "Preparing" :
                              "Out for Delivery"}
                      </span>
                    </div>
                    <p className="text-gray-600">{order.items} items • {order.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 Khana Sathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}