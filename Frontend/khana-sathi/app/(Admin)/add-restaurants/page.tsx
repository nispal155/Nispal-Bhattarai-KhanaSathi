"use client";

import Image from "next/image";
import { useState } from "react";
import { Home, Store, FileText, Users, Shield, Settings, LogOut, Upload } from "lucide-react";
import { createRestaurant } from "@/lib/restaurantService";
import toast from "react-hot-toast";




export default function AddRestaurant() {

// form data store
const [formData, setFormData] = useState({
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
  cuisineType: "",
  openingHour: "",
  closingHour: "",
  contactPhone: "",
  contactEmail: "",
  logoUrl: ""
});


//input handler
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

//submit handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    await createRestaurant(formData);
    toast.success("Restaurant created successfully!");

    setFormData({
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      cuisineType: "",
      openingHour: "",
      closingHour: "",
      contactPhone: "",
      contactEmail: "",
      logoUrl: ""
    });

    setLogoPreview(null);
  } catch (err: any) {
    toast.error(
      err?.response?.data?.message || "Failed to create restaurant"
    );
  } finally {
    setLoading(false);
  }
};


const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);


  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData(prev => ({
  ...prev,
  logoUrl: reader.result as string
}));
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
          <h2 className="text-3xl font-bold text-gray-900">Add New Restaurant</h2>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/admin-avatar.jpg" alt="Admin" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8 max-w-4xl mx-auto">
          <form  onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 space-y-10">
            {/* Basic Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    defaultValue="Taste of Italy"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                  <p className="text-red-600 text-sm mt-2">Restaurant name is required and must be unique.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                  <input
                  value={formData.addressLine1}
                  onChange={handleChange}
                    type="text"
                    name="addressLine1"
                    defaultValue="123 Main Street"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2 (Optional)</label>
                  <input
                  value={formData.addressLine2}
                  onChange={handleChange}
                    type="text"
                    name="addressLine2"
                    defaultValue="Suite 101"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                     value={formData.city}
                     onChange={handleChange}
                      type="text"
                      name="city"
                      defaultValue="Itahari"
                      className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium  text-gray-700 mb-2">State</label>
                    <input
                     value={formData.state}
                     onChange={handleChange}
                      type="text"
                      name="state"
                      defaultValue="Koshi"
                      className="w-full px-5 py-4 bg-white border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <input
                    value={formData.zipCode}
                    onChange={handleChange}
                      type="text"
                      name="zipCode"
                      defaultValue="10001"
                      className="w-full px-5 py-4 bg-white border text-black border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Details */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Operational Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                  <input
                  value={formData.cuisineType}
                  onChange={handleChange}
                    type="text"
                    name="cuisineType"
                    defaultValue="Italian, American, Vegan (comma-separated)"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Hour</label>
                    <input
                    value={formData.openingHour}
                    onChange={handleChange}
                      type="time"
                      name="openingHour"
                      defaultValue="09:00"
                      className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Hour</label>
                    <input
                    value={formData.closingHour}
                    onChange={handleChange}
                      type="time"
                      name="closingHour"
                      defaultValue="22:00"
                      className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input
                  value={formData.contactPhone}
                  onChange={handleChange}
                    type="tel"
                    name="contactPhone"
                    defaultValue="+977-9876543210"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input
                    value={formData.contactEmail}
                    onChange={handleChange}
                    type="email"
                    name="contactEmail"
                    defaultValue="contact@tasteofitaly.com"
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Logo Upload */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Logo</h3>
              <p className="text-gray-600 mb-6">
                Upload Logo (For optimal display, upload a .png file with transparent background)
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-6">
                    <Upload className="w-16 h-16 text-gray-400" />
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo Preview" width={200} height={200} className="rounded-xl shadow-lg" />
                    ) : (
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-48 h-48 flex items-center justify-center">
                        <span className="text-gray-500">Logo Restaurant</span>
                      </div>
                    )}
                    <span className="text-blue-600 font-medium hover:underline">Click to upload</span>
                  </div>
                  <input type="file" name="logoUrl" value={formData.logoUrl} accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-8">
              <button disabled={loading} type="button" className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit"  disabled={loading} className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-lg transition">
             
                {loading ? "Saving..." : "Save Restaurant"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 Khana Sathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}