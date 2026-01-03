"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone, Mail, AlertCircle, ChevronDown } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-orange-600">Khana</span>
              <span className="text-green-600">Sathi</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            

            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 shadow-md transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Profile
            </button>

            <button className="p-2">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center gap-12">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🛒
              </div>
              <div className="w-40 h-1 bg-gray-300"></div>
            </div>

            {/* Step 2 - Credit Card */}
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full flex items-center justify-center">
              <Image src="/credit-card.svg" alt="credit card" width={28} height={28} />
            </div>

            <div className="w-40 h-1 bg-gray-300"></div>

            {/* Step 3 */}
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Checkout Form */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Form */}
          <div className="lg:col-span-2 space-y-10">
            {/* Personal Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    defaultValue="Nispal"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Bhattarai"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      defaultValue="+977 9812345670"
                      className="w-full pl-14 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      defaultValue="nispalbhattarai@gmail.com"
                      className="w-full pl-14 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Details */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <div className="relative">
                    <select className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400">
                      <option>Itahari</option>
                      <option>Dharan</option>
                      <option>Biratnagar</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    defaultValue="Itahari-4"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input
                    type="text"
                    defaultValue="50123"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                  
                </div>
              </div>
            </section>

            {/* Continue Button */}
            <div className="pt-8">
              <button
                onClick={() => router.push("/payment")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl px-16 py-5 rounded-full shadow-xl transition transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl text-black font-bold mb-6">Order Summary</h3>

              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex gap-4">
                  <Image
                    src="/buffalo-wrap.jpg"
                    alt="Buffalo Chicken Wrap"
                    width={100}
                    height={100}
                    className="rounded-2xl object-cover text-black shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Buffalo Chicken Wrap</h4>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="w-9 h-9 border border-gray-300 text-black rounded-full hover:bg-gray-100">-</button>
                      <span className="font-medium text-black text-lg">1</span>
                      <button className="w-9 h-9 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black text-xl">$36.99</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-4">
                  <Image
                    src="/green-smoothie.jpg"
                    alt="Green Smoothie"
                    width={100}
                    height={100}
                    className="rounded-2xl object-cover text-black shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Green Smoothie</h4>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="w-9 h-9 border border-gray-300 text-black rounded-full hover:bg-gray-100">-</button>
                      <span className="font-medium text-black text-lg">1</span>
                      <button className="w-9 h-9 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black text-xl">$18.99</p>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>$55.98</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery:</span>
                  <span>$8.20</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>$10.0</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 border-t-2 border-gray-300">
                  <span>Total:</span>
                  <span>$74.18</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
