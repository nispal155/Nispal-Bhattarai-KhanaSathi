"use client";

import Image from "next/image";
import { Home, UtensilsCrossed, ClipboardList, Star, Tag, FileText, Users, DollarSign, MessageCircle, Package, Settings, LogOut, Clock, MapPin, Bike } from "lucide-react";

export default function OrdersBoard() {
  const newOrders = [
    {
      id: "RM1001",
      customer: "Alice Smith",
      items: "Spicy Chicken Burger, Large Fries",
      time: "15 min",
      type: "Delivery",
    },
    {
      id: "RM1002",
      customer: "Bob Johnson",
      items: "Vegan Pizza, Garlic Bread",
      time: "10 min",
      type: "Pickup",
    },
  ];

  const preparingOrders = [
    {
      id: "RM1003",
      customer: "Charlie Brown",
      items: "Classic Beef Burger, Classic Shake",
      time: "25 min",
      type: "Delivery",
    },
    {
      id: "RM1004",
      customer: "Diana Prince",
      items: "Grilled Salmon, Side Salad",
      time: "8 min",
      type: "Pickup",
    },
  ];

  const readyOrders = [
    {
      id: "RM1005",
      customer: "Eve Adams",
      items: "Pasta Carbonara, Tiramisu",
      time: "5 min",
      type: "Delivery",
    },
    {
      id: "RM1006",
      customer: "Frank White",
      items: "Chicken Caesar Wrap",
      time: "Pickup",
      type: "Pickup",
    },
  ];

  const outForDelivery = [
    {
      id: "RM1007",
      customer: "Sophia L.",
      items: "Sushi Platter, Miso Soup",
      time: "10 min",
      type: "Delivery",
    },
    {
      id: "RM1008",
      customer: "John M.",
      items: "Fish and Chips",
      time: "Delivery",
      type: "Delivery",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "preparing":
        return "bg-yellow-100 text-yellow-700";
      case "ready":
        return "bg-green-100 text-green-700";
      case "out":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* New Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                New Orders <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">2</span>
              </h3>
              <div className="space-y-6">
                {newOrders.map((order) => (
                  <div key={order.id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">{order.id} • {order.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.type} • {order.time}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">New</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {order.items}</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        Start Preparing
                      </button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparing */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Preparing <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">2</span>
              </h3>
              <div className="space-y-6">
                {preparingOrders.map((order) => (
                  <div key={order.id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">{order.id} • {order.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.type} • {order.time}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Preparing</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {order.items}</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        Mark Ready
                      </button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Ready for Pickup/Delivery <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">2</span>
              </h3>
              <div className="space-y-6">
                {readyOrders.map((order) => (
                  <div key={order.id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">{order.id} • {order.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.type} • {order.time}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Ready</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {order.items}</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        Out for Delivery
                      </button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Out for Delivery */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                Out for Delivery <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">2</span>
              </h3>
              <div className="space-y-6">
                {outForDelivery.map((order) => (
                  <div key={order.id} className="p-5 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">{order.id} • {order.customer}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.type} • {order.time}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Out for Delivery</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">Items: {order.items}</p>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        Mark Delivered
                      </button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}