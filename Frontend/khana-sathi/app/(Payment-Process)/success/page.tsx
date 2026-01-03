"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-orange-600">KhanaSathi</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
            </div>

            <Link
              href="/profile"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 shadow-md transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-12">
            <div className="relative">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            </div>
            <div className="flex-1 h-1 bg-yellow-400"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            </div>
            <div className="flex-1 h-1 bg-gray-300"></div>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 text-center py-16">
        {/* Illustration */}
        <div className="relative mb-16">
          <Image
            src="/Character.svg"
            alt="Delivery Boy"
            width={500}
            height={500}
            className="mx-auto"
            priority
          />
        </div>

        {/* Success Message */}
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Thank! Your order is on the way.
        </h1>

        {/* Track Button */}
        <Link
          href="/track-order"
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl px-16 py-6 rounded-full shadow-2xl transition transform hover:scale-105"
        >
          Track Your Order
        </Link>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm py-8 mt-20">
        © 2025 KhanaSathi. All rights reserved.
      </footer>
    </div>
  );
}