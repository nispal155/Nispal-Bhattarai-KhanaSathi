"use client";
import { useState } from "react";
import { Phone, Mail, AlertCircle, ChevronDown, Check, Info } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
export default function PaymentPage() {
  const [billingSame, setBillingSame] = useState(false);
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                <Check className="w-6 h-6" />
              </div>
              <div className="w-40 h-1 bg-yellow-500"></div>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
            <Image
              src="/credit-card.svg"
              alt="Credit Card"
              width={24}   
              height={24}  
              className="object-contain"
            />
          </div>

            <div className="w-40 h-1 bg-gray-300"></div>
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full flex items-center justify-center">
              <Check className="w-7 h-7 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">Payment</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2 space-y-10">
            {/* Payment Methods */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Image src="/MasterCard.svg" alt="Mastercard" width={60} height={40} className="rounded-lg shadow-sm" />
              <Image src="/VisaCard.svg" alt="Visa" width={60} height={40} className="rounded-lg shadow-sm border-2 border-blue-500" />
              <Image src="/Esewa.svg" alt="eSewa" width={60} height={40} className="rounded-lg shadow-sm" />
              <Image src="/Khalti.svg" alt="Khalti" width={60} height={40} className="rounded-lg shadow-sm" />
            </div>

            {/* Card Details */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                  <input
                    type="text"
                    defaultValue="Nispal Bhattarai"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    defaultValue="1234 5678 9012 3456"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                  <input
                    type="text"
                    defaultValue="06/25"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVC Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="121"
                      className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Info className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    3 digit code on the back of your card
                  </p>
                </div>
              </div>

              {/* Billing Address Checkbox */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBillingSame(!billingSame)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    billingSame ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                  } transition`}
                >
                  {billingSame && <Check className="w-4 h-4 text-white" />}
                </button>
                <p className={`${billingSame ? "text-green-700" : "text-gray-700"} font-medium`}>
                  Billing address is the same as shipping address.
                </p>
              </div>
            </div>

            {/* Purchase Button */}
            <div className="flex justify-center pt-8">
              <button
      onClick={() => router.push("/success")}
      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl px-20 py-5 rounded-full shadow-xl transition transform hover:scale-105"
    >
      Purchase
    </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold mb-6">Order Summary</h3>

              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex gap-4">
                  <Image
                    src="/buffalo-wrap.jpg"
                    alt="Buffalo Chicken Wrap"
                    width={100}
                    height={100}
                    className="rounded-2xl object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Buffalo Chicken Wrap</h4>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="w-9 h-9 border border-gray-300 rounded-full hover:bg-gray-100">-</button>
                      <span className="font-medium text-lg">1</span>
                      <button className="w-9 h-9 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">$36.99</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-4">
                  <Image
                    src="/green-smoothie.jpg"
                    alt="Green Smoothie"
                    width={100}
                    height={100}
                    className="rounded-2xl object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Green Smoothie</h4>
                    <div className="flex items-center gap-3 mt-3">
                      <button className="w-9 h-9 border border-gray-300 rounded-full hover:bg-gray-100">-</button>
                      <span className="font-medium text-lg">1</span>
                      <button className="w-9 h-9 bg-yellow-500 text-white rounded-full hover:bg-yellow-600">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">$18.99</p>
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
