"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MessageSquare, MapPin, Clock } from "lucide-react";

export default function OrderTrackingPage() {
  const orderStatus = {
    currentStep: 3, // 1: Confirmed, 2: Preparing, 3: On the way, 4: Delivered
    orderId: "KS-2025-0142",
    estimatedTime: "15-20 min",
    restaurant: {
      name: "Nepali Kitchen",
      address: "Thamel, Kathmandu",
    },
    deliveryAddress: "123 Durbar Marg, Kathmandu",
    rider: {
      name: "Ram Sharma",
      phone: "+977 9812345678",
      image: "/rider.jpg",
      rating: 4.8,
      vehicle: "Honda Dio",
      vehicleNumber: "BA 12 PA 1234",
    },
    items: [
      { name: "Chicken Momo (10 pcs)", quantity: 2, price: 440 },
      { name: "Veg Thali", quantity: 1, price: 180 },
      { name: "Masala Tea", quantity: 2, price: 80 },
    ],
    total: 770,
  };

  const steps = [
    { id: 1, title: "Order Confirmed", description: "Your order has been received" },
    { id: 2, title: "Preparing", description: "Restaurant is preparing your food" },
    { id: 3, title: "On the Way", description: "Your rider is heading to you" },
    { id: 4, title: "Delivered", description: "Enjoy your meal!" },
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
              <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{orderStatus.orderId}</h1>
              <p className="text-gray-600 text-sm">From {orderStatus.restaurant.name}</p>
            </div>
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{orderStatus.estimatedTime}</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      step.id <= orderStatus.currentStep
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.id < orderStatus.currentStep ? (
                      <span>✓</span>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      step.id <= orderStatus.currentStep
                        ? "text-red-500 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" style={{ marginLeft: '5%', marginRight: '5%' }}>
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{
                  width: `${((orderStatus.currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rider Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Delivery Partner</h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                <Image
                  src={orderStatus.rider.image}
                  alt={orderStatus.rider.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{orderStatus.rider.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-yellow-500">★</span>
                  <span>{orderStatus.rider.rating} Rating</span>
                </div>
                <p className="text-sm text-gray-500">
                  {orderStatus.rider.vehicle} • {orderStatus.rider.vehicleNumber}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`tel:${orderStatus.rider.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
              <button className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors">
                <MessageSquare className="w-5 h-5" />
                Message
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Delivery Address</h2>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Home</h3>
                <p className="text-gray-600">{orderStatus.deliveryAddress}</p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Live Map Tracking</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>

          <div className="space-y-3">
            {orderStatus.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <span className="text-gray-900">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">Rs. {item.price}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>Rs. {orderStatus.total}</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Report an Issue
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel Order
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Contact Support
            </button>
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
