"use client";

import Link from "next/link";
import { CheckCircle, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const orderDetails = {
    orderId: "KS-2025-0142",
    restaurant: "Nepali Kitchen",
    estimatedTime: "30-45 min",
    deliveryAddress: "123 Durbar Marg, Kathmandu",
    total: 770,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Confetti Animation (simplified) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-3 h-3 rounded-sm ${
                  ["bg-red-500", "bg-yellow-500", "bg-green-500", "bg-blue-500", "bg-purple-500"][
                    Math.floor(Math.random() * 5)
                  ]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully. We&apos;re preparing your delicious food!
          </p>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Order ID</span>
              <span className="font-semibold text-gray-900">{orderDetails.orderId}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Restaurant</span>
              <span className="font-medium text-gray-900">{orderDetails.restaurant}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Total Paid</span>
              <span className="font-semibold text-green-600">Rs. {orderDetails.total}</span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-700">
            <Clock className="w-5 h-5" />
            <span>Estimated delivery: <strong>{orderDetails.estimatedTime}</strong></span>
          </div>

          {/* Delivery Address */}
          <div className="flex items-center justify-center gap-2 mb-6 text-gray-600 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{orderDetails.deliveryAddress}</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/order-tracking"
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              Track Your Order
            </Link>
            <Link
              href="/browse-restaurants"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 mt-6">
            Need help? <Link href="/support" className="text-red-500 hover:underline">Contact Support</Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Thank you for ordering with KhanaSathi! 🍜
        </p>
      </div>
    </div>
  );
}
