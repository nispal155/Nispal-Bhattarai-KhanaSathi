"use client";

import Image from "next/image";
import { useState } from "react";
import { Home, Store, FileText, Users, Shield, Settings, LogOut, Upload, MapPin } from "lucide-react";

export default function EditRestaurant() {
  const [isActive, setIsActive] = useState(true);
  const [logoPreview, setLogoPreview] = useState("/golden-spoon.jpg"); // Current logo

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
            <a href="/Restaurants" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
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
          <h2 className="text-3xl font-bold text-gray-900">Edit Restaurant Details</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-10">
              {/* General Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">General Information</h3>
                <p className="text-gray-600 mb-6">Basic details about the restaurant.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                    <input
                      type="text"
                      defaultValue="The Golden Spoon"
                      className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="text-sm font-medium text-gray-700">Active Status</label>
                    <button
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                        isActive ? "bg-red-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          isActive ? "translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Location & Map */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Location & Map</h3>
                <p className="text-gray-600 mb-6">Physical address and map coordinates.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      defaultValue="123 Main Street, Anytown, USA"
                      className="w-full px-5 py-4 bg-red-50 border-2 border-red-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                    <p className="text-red-600 text-sm mt-2">Please enter a valid address.</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-3">Map Preview</p>
                    <div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
                      <Image
                        src="/map-preview.jpg"
                        alt="Map Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-4">
                          <MapPin className="w-12 h-12 text-white" />
                          <p className="text-white font-bold text-xl mt-2">123</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">Location updated automatically based on address.</p>
                  </div>
                </div>
              </div>

              {/* Cuisine & Tags */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Cuisine & Tags</h3>
                <p className="text-gray-600 mb-6">Define the culinary style and keywords for the restaurant.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium  text-gray-700 mb-2">Cuisine Type</label>
                    <select className="w-full px-5 py-4 text-black  bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option>Italian</option>
                      <option>Chinese</option>
                      <option>Indian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-3 p-4 bg-gray-50  text-black rounded-xl">
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">Italian</span>
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">Fine Dining</span>
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">Pasta</span>
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm">Reservations</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Opening Hours</h3>
                <p className="text-gray-600 mb-6">Set the daily operating hours for the restaurant.</p>

                <div className="space-y-5 text-black ">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
                    const isClosed = day === "Sunday";
                    return (
                      <div key={day} className="flex items-center gap-6">
                        <button
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                            !isClosed ? "bg-red-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                              !isClosed ? "translate-x-9" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="w-32 font-medium text-gray-900">{day}</span>
                        {isClosed ? (
                          <span className="text-gray-500">Closed</span>
                        ) : (
                          <>
                            <select className="px-5 py-3 bg-white border border-gray-300 rounded-xl">
                              <option>09:00</option>
                            </select>
                            <span className="text-gray-500">-</span>
                            <select className="px-5 py-3 bg-white border border-gray-300 rounded-xl">
                              <option>22:00</option>
                            </select>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Details</h3>
                <p className="text-gray-600 mb-6">Customer contact information.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium  text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-5 py-4 text-black  bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="info@goldenspoon.com"
                      className="w-full px-5 py-4 bg-white border text-black  border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      defaultValue="www.goldenspoon.com"
                      className="w-full px-5 py-4 bg-white border text-black  border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery & Financials */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Delivery & Financials</h3>
                <p className="text-gray-600 mb-6">Configure delivery services and commission rates.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Service Options</label>
                    <div className="flex gap-6">
                      <label className="flex items-center text-black  gap-3">
                        <input type="checkbox" defaultChecked className="w-5 h-5  text-red-500 rounded focus:ring-red-500" />
                        <span>Offers Delivery</span>
                      </label>
                      <label className="flex items-center text-black  gap-3">
                        <input type="checkbox" defaultChecked className="w-5 h-5 text-red-500 rounded focus:ring-red-500" />
                        <span>Offers Pickup</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Commission Rate</label>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        defaultValue="15"
                        className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                        15%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Documents */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Business Documents</h3>
                <p className="text-gray-600 mb-6">Upload relevant legal and operational documents.</p>
                <p className="text-sm text-gray-500 mb-6">Accepted Formats: PDF, JPG, PNG. Max file size: 5MB.</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 text-black  bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Health Permit_2024.pdf</span>
                    </div>
                    <button className="text-red-600 hover:text-red-700">Remove</button>
                  </div>
                  <div className="flex items-center justify-between p-4 text-black  bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Business License_123.pdf</span>
                    </div>
                    <button className="text-red-600 hover:text-red-700">Remove</button>
                  </div>
                </div>

                <label className="mt-6 block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 transition">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <span className="text-blue-600 font-medium">Click to upload more documents</span>
                  </div>
                  <input type="file" className="hidden" multiple />
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-8">
                <button className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-lg transition">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Right Column - Logo */}
            <div className="space-y-10">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Restaurant Logo</h3>
                <p className="text-gray-600 mb-6">Preview of the current restaurant logo.</p>

                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden ring-8 ring-gray-100 mb-6">
                    <Image src={logoPreview} alt="Restaurant Logo" width={192} height={192} className="object-cover" />
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-blue-600 font-medium hover:underline flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Change logo
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
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