"use client";

import Image from "next/image";
import { Home, Store, FileText, Users, Shield, Settings, LogOut, Phone, MapPin, Clock, Star, FileText as FileIcon } from "lucide-react";

export default function ViewRestaurant() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg relative">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} className="object-contain" />
            <div>
              <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
              <p className="text-sm text-gray-600">Admin</p>
            </div>
          </div>

          <nav className="space-y-2">
            <a href="/admin-dashboard" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Home className="w-5 h-5" />
              Home
            </a>
            <a href="Restaurants" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <Store className="w-5 h-5" />
              Restaurants
            </a>
            <a href="/Reports" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <FileText className="w-5 h-5" />
              Reports
            </a>
            <a href="/delivery-staff" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Users className="w-5 h-5" />
              Delivery Staff
            </a>
            <a href="/parental-control" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Shield className="w-5 h-5" />
              Parental Control
            </a>
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-5 h-5" />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-bold text-gray-900">TasteBuds Bistro</h1>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
          </div>
          <div className="flex items-center gap-4">
            
            <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
              <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-10">

            <button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md transition">
              Edit Restaurant
            </button>
            <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
              Deactivate
            </button>
            <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
              View Menu
            </button>
            <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
              Add Note
            </button>
            {/* Left Column */}
            <div className="space-y-10">
              {/* Restaurant Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Details</h3>

                <div className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-900">Contact Information</span>
                    </div>
                    <p className="text-gray-700 ml-9">+1 (555) 123-4567</p>
                    <p className="text-gray-700 ml-9">contact@tastebudsbistro.com</p>
                  </div>

                  {/* Address */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-900">Address</span>
                    </div>
                    <p className="text-gray-700 ml-9">
                      123 Main Street<br />
                      Anytown, CA 90210
                    </p>
                  </div>

                  {/* Map Preview */}
                  <div className="mt-6">
                    <div className="bg-gray-200 rounded-xl h-64 relative overflow-hidden">
                      <Image
                        src="/map-tastebuds.jpg"
                        alt="Restaurant Location"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-500 rounded-full p-4 shadow-2xl">
                          <MapPin className="w-10 h-10 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuisine Tags */}
                  <div>
                    <span className="font-medium text-gray-900">Cuisine Tags</span>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">Italian</span>
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">Mediterranean</span>
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">Casual Dining</span>
                    </div>
                  </div>

                  {/* Opening Hours */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-900">Opening Hours</span>
                    </div>
                    <div className="ml-9 space-y-1 text-gray-700">
                      <div className="flex justify-between">
                        <span>Monday:</span>
                        <span>11:00 AM – 10:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tuesday:</span>
                        <span>11:00 AM – 10:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wednesday:</span>
                        <span>11:00 AM – 10:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thursday:</span>
                        <span>11:00 AM – 11:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Friday:</span>
                        <span>11:00 AM – 11:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>12:00 PM – 11:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="text-red-600">Closed</span>
                      </div>
                    </div>
                  </div>

                  {/* Ratings & Reviews */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4">Ratings & Reviews</h4>
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                      <span className="text-4xl font-bold text-gray-900">4.7</span>
                      <span className="text-gray-600">(289 Reviews)</span>
                    </div>
                    <p className="text-gray-700">
                      Customers consistently praise the fresh ingredients and cozy ambiance.
                    </p>
                  </div>

                  {/* Menu Summary */}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-6">Menu Summary</h4>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-gray-600">Total Menu Items:</p>
                        <p className="text-3xl font-bold text-gray-900">112</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Distinct Categories:</p>
                        <p className="text-3xl font-bold text-gray-900">14</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-10">
              {/* Recent Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Order ID</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "ORD001", customer: "Alice Johnson", date: "2023-10-26", amount: "$75" },
                        { id: "ORD002", customer: "Bob Williams", date: "2023-10-26", amount: "$52" },
                        { id: "ORD003", customer: "Charlie Davis", date: "2023-10-25", amount: "$68" },
                        { id: "ORD004", customer: "Diana Miller", date: "2023-10-25", amount: "$44" },
                        { id: "ORD005", customer: "Eve White", date: "2023-10-24", amount: "$59" },
                      ].map((order) => (
                        <tr key={order.id} className="border-b border-gray-100">
                          <td className="py-4 font-medium text-blue-600">{order.id}</td>
                          <td className="py-4 text-gray-900">{order.customer}</td>
                          <td className="py-4 text-gray-700">{order.date}</td>
                          <td className="py-4 font-semibold text-gray-900">{order.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 text-center">
                  <button className="text-red-600 hover:text-red-700 font-medium">View All Orders</button>
                </div>
              </div>

              {/* Business Documents */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Documents</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <FileIcon className="w-8 h-8 text-blue-600" />
                    <span className="flex-1">Business License 2023</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <FileIcon className="w-8 h-8 text-blue-600" />
                    <span className="flex-1">Health Permit Q4 2023</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <FileIcon className="w-8 h-8 text-blue-600" />
                    <span className="flex-1">Fire Safety Certificate</span>
                  </div>
                </div>
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