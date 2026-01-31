"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Star,
  Tag,
  FileText,
  Users,
  MessageCircle,
  Package,
  Settings,
  LogOut,
  Edit2,
  Trash2,
} from "lucide-react";

export default function MenuManagement() {
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  const menuItems = [
    { name: "Classic Margherita Pizza", category: "Pizza", price: "NPR 250", inStock: true },
    { name: "Spicy Arrabbiata Pasta", category: "Pasta", price: "NPR 140", inStock: false },
    { name: "Grilled Chicken Salad", category: "Salads", price: "NPR 190", inStock: true },
    { name: "Cheeseburger Deluxe", category: "Burgers", price: "NPR 190", inStock: true },
    { name: "Vegetable Lasagna", category: "Pasta", price: "NPR 300", inStock: true },
    { name: "Chocolate Lava Cake", category: "Desserts", price: "NPR 350", inStock: false },
    { name: "Creamy Mushroom Risotto", category: "Italian", price: "NPR 220", inStock: true },
    { name: "Fish and Chips", category: "Seafood", price: "NPR 330", inStock: true },
  ];

  const filteredItems = showInStockOnly
    ? menuItems.filter((item) => item.inStock)
    : menuItems;

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
            <a href="/menu" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
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
            <h1 className="text-4xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage all your delicious menu items, their prices, and availability.</p>
          </div>
          <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg transition">
            + Add Menu Item
          </button>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6 mb-10 items-center">
            <select className="px-6 py-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700">
              <option>All Categories</option>
            </select>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowInStockOnly(!showInStockOnly)}
                className={`relative inline-flex h-9 w-16 items-center rounded-full transition ${
                  showInStockOnly ? "bg-red-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition ${
                    showInStockOnly ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-gray-700 font-medium">Show In Stock Only</span>
            </div>

            <div className="ml-auto">
              <button className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition">
                Bulk Price Update
              </button>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredItems.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Image Placeholder - No Dashed Border */}
                <div className="h-56 bg-gray-300">
                  {/* Solid gray placeholder - no lines */}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.name}</h3>
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {item.category}
                    </span>
                    <span className="text-xl font-bold text-gray-900">{item.price}</span>
                  </div>

                  {/* Stock Toggle & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                          item.inStock ? "bg-red-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                            item.inStock ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`text-sm font-medium ${item.inStock ? "text-green-700" : "text-gray-500"}`}>
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button className="text-gray-600 hover:text-blue-600 transition">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button className="text-gray-600 hover:text-red-600 transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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