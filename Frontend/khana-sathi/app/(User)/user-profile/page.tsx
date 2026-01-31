"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, MapPin, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Edit2 } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal");

  const user = {
    name: "Rajesh Sharma",
    email: "rajesh.sharma@email.com",
    phone: "+977 9812345678",
    avatar: "/avatar.jpg",
    points: 1250,
    ordersCount: 47,
    memberSince: "Jan 2024",
  };

  const addresses = [
    {
      id: "1",
      label: "Home",
      address: "123 Durbar Marg, Kathmandu",
      isDefault: true,
    },
    {
      id: "2",
      label: "Office",
      address: "456 New Road, Kathmandu",
      isDefault: false,
    },
  ];

  const paymentMethods = [
    {
      id: "1",
      type: "eSewa",
      detail: "Connected",
      icon: "💚",
    },
    {
      id: "2",
      type: "Card",
      detail: "**** **** **** 4532",
      icon: "💳",
    },
  ];

  const recentOrders = [
    {
      id: "KS-2025-0142",
      restaurant: "Nepali Kitchen",
      date: "Jan 15, 2025",
      total: 770,
      status: "Delivered",
    },
    {
      id: "KS-2025-0139",
      restaurant: "Mama Mia's Pizzeria",
      date: "Jan 12, 2025",
      total: 1250,
      status: "Delivered",
    },
    {
      id: "KS-2025-0135",
      restaurant: "Sushi Central",
      date: "Jan 10, 2025",
      total: 890,
      status: "Delivered",
    },
  ];

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "👤" },
    { id: "addresses", label: "Addresses", icon: "📍" },
    { id: "payments", label: "Payment Methods", icon: "💳" },
    { id: "orders", label: "Order History", icon: "📦" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍜</span>
              </div>
              <div>
                <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/profile" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
                <span>👤</span> Profile
              </Link>
              <Link href="/support" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>💬</span> Support
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 overflow-hidden">
              <Image src="/avatar.jpg" alt="Profile" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-pink-200 overflow-hidden">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-500 text-sm">Member since {user.memberSince}</p>
            </div>

            <div className="flex gap-6 text-center">
              <div className="px-4">
                <div className="text-2xl font-bold text-red-500">{user.points}</div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
              <div className="px-4 border-l border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{user.ordersCount}</div>
                <div className="text-sm text-gray-500">Orders</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-red-50 text-red-500 border-l-4 border-red-500"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}

              <div className="border-t border-gray-200">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  <button className="flex items-center gap-2 text-red-500 hover:text-red-600">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                    <p className="text-gray-900">15 March 1990</p>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
                  <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <MapPin className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{address.label}</h3>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{address.address}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === "payments" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <CreditCard className="w-4 h-4" />
                    Add New
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">{method.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{method.type}</h3>
                          <p className="text-sm text-gray-500">{method.detail}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order History</h2>

                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                          <span className="text-xl">🍽️</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{order.restaurant}</h3>
                          <p className="text-sm text-gray-500">
                            {order.id} • {order.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">Rs. {order.total}</p>
                        <span className="text-sm text-green-600">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-4 text-red-500 hover:text-red-600 font-medium">
                  View All Orders
                </button>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive order updates</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-500">Offers and promotions</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>

                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">Change Password</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-900">Help & Support</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
                  <button className="px-4 py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-red-500 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <p>© 2025 KhanaSathi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
