"use client";
import { useState } from "react";

import Image from "next/image";
import { Home, Store, FileText, Users, Shield, Settings, LogOut, Eye, Calendar, Download } from "lucide-react";

export default function Reports()  {
  const topPerformingRestaurants = [
  { id: 1, restaurant: "The Green Plate", totalSales: "NPR 52,000", orders: 320 },
  { id: 2, restaurant: "Sushi Delight", totalSales: "NPR 48,300", orders: 295 },
  { id: 3, restaurant: "Burger Haven", totalSales: "NPR 41,200", orders: 260 },
  { id: 4, restaurant: "Spice Route", totalSales: "NPR 38,900", orders: 240 },
  { id: 5, restaurant: "Pizzeria Bella", totalSales: "NPR 35,100", orders: 215 },
];




  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg relative">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
              <p className="text-sm text-gray-600">Admin</p>
            </div>
          </div>

          <nav className="space-y-2">
            <a href="/admin-dashboard" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5" />
              Home
            </a>

            <a href="/Restaurants" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Store className="w-5 h-5" />
              Restaurants
            </a>

            <a href="/Reports" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <FileText className="w-5 h-5" />
              Reports
            </a>

            <a href="/delivery-staff" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Users className="w-5 h-5" />
              Delivery Staff
            </a>

            <a href="/parental-control" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Shield className="w-5 h-5" />
              Parental Control
            </a>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-6 left-0 right-0 px-6 space-y-3">
          <a href="#" className="flex w-full items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
            Settings
          </a>

          <a href="#" className="flex w-full items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="w-5 h-5" />
            Logout
          </a>
        </div>
      </aside>
     {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Report</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </header>
        {/* Page Content */}
    
          {/* Filter & Export */}
            <div className="flex justify-end gap-4 mb-8 mt-3">
              {/* Date Filter */}
              <select className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
              {/* Export CSV */}
              <button className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-sm">
                <Download className="w-5 h-5" />
                <span className="font-medium">Export CSV</span>
              </button>
            </div>


        <div className="p-8">
          <div className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900">1,245</p>
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +12.5% ↑ from previous period
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-gray-900">NPR 52,100</p>
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +8.2% ↑ from previous Month
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Avg. Order Value</p>
                <p className="text-4xl font-bold text-gray-900">78</p>
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↑</span> +0.5% ↑ from previous Month
                </p>
              </div>

              <div className="bg-white rounded-2xl  p-6 border border-gray-200">
                <p className="text-gray-600 mb-2">Active Delivery Staff</p>
                <p className="text-4xl font-bold text-gray-900">45</p>
               <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <span>↓</span> -1.2% ↓ from previous Month
                </p>
              </div>
            </div>
          </div>

          {/* Top performing Resturants */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Performing Resturants</h3>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">RESTAURANT</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Total Sales</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Order</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {topPerformingRestaurants.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-5 font-medium text-gray-900">
                        {item.restaurant}
                      </td>

                      <td className="px-6 py-5 text-gray-900">
                        {item.totalSales}
                      </td>

                      <td className="px-6 py-5 text-gray-900">
                        {item.orders}
                      </td>

                      <td className="px-6 py-5">
                        <button className="text-gray-600 hover:text-blue-600">
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                </table>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8 border-t border-gray-200 mt-16">
          © 2025 KhanaSathi. All rights reserved.
        </footer>
      </div>
     
    </div>
  );
};