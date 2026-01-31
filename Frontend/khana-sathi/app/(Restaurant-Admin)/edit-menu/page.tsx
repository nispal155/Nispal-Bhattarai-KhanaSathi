"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Star,
  Tag,
  FileText,
  Users,
  DollarSign,
  MessageCircle,
  Package,
  Settings,
  LogOut,
  Upload,
  X,
} from "lucide-react";

export default function EditMenuItem() {
  const [imagePreview, setImagePreview] = useState<string | null>("/signature-dish.jpg"); // Current item image
  const [availableNow, setAvailableNow] = useState(true);
  const [allergens, setAllergens] = useState<string[]>(["Dairy", "Gluten"]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAllergen = (allergen: string) => {
    setAllergens(allergens.filter((a) => a !== allergen));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} className="object-contain" />
            <h1 className="text-xl font-bold text-red-600">KhanaSathi</h1>
          </div>

          <nav className="space-y-2">
            <a href="/RM-Dashboard" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Home className="w-5 h-5" />
              Dashboard
            </a>
            <a href="/RM-Dashboard/menu" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <UtensilsCrossed className="w-5 h-5" />
              Menu
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <ClipboardList className="w-5 h-5" />
              Orders Board
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Star className="w-5 h-5" />
              Reviews
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Tag className="w-5 h-5" />
              Offers
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <FileText className="w-5 h-5" />
              Analytics
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Users className="w-5 h-5" />
              Staff
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <DollarSign className="w-5 h-5" />
              Payments
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <MessageCircle className="w-5 h-5" />
              Chat
            </a>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Package className="w-5 h-5" />
              Group Orders
            </a>
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-3">
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <a href="#" className="flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-5 h-5" />
            Log Out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">Edit Menu Item</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-orange-100">
            <Image src="/owner-avatar.jpg" alt="Owner" width={48} height={48} className="object-cover" />
          </div>
        </header>

        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left - Form */}
            <div className="space-y-10">
              {/* Basic Information */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h3>

                {/* Item Photo */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Item Photo</label>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl w-48 h-48 flex flex-col items-center justify-center gap-4 hover:border-red-400 transition relative">
                      {imagePreview ? (
                        <div className="relative">
                          <Image src={imagePreview} alt="Current Item" width={192} height={192} className="rounded-xl object-cover" />
                          <button className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100">
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400" />
                          <span className="text-blue-600 font-medium">Upload New Image</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  <p className="text-sm text-gray-500 mt-3">Recommended: 16:9 aspect ratio</p>
                </div>

                {/* Item Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                  <input
                    type="text"
                    defaultValue="Signature Dish Name"
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={4}
                    defaultValue="A brief, appetizing description of the dish, highlighting key ingredients and flavor profile."
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select defaultValue="Main Course" className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                      <option>Main Course</option>
                      <option>Appetizer</option>
                      <option>Dessert</option>
                      <option>Beverage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                    <input
                      type="text"
                      defaultValue="1990"
                      className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Advanced Options</h3>

                <div className="space-y-6">
                  {/* Modifiers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Modifiers</label>
                    <select className="w-full px-5 py-4 border border-gray-300 rounded-xl">
                      <option>Size Options</option>
                    </select>
                  </div>
                  <div>
                    <select className="w-full px-5 py-4 border border-gray-300 rounded-xl">
                      <option>Extra Toppings</option>
                    </select>
                  </div>

                  {/* Available Now */}
                  <div className="flex items-center gap-6">
                    <label className="text-sm font-medium text-gray-700">Available Now</label>
                    <button
                      onClick={() => setAvailableNow(!availableNow)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition ${
                        availableNow ? "bg-red-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          availableNow ? "translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Estimated Prep Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Prep Time (minutes)</label>
                    <input
                      type="number"
                      defaultValue="20"
                      className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>

                  {/* Allergens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Allergens</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                        >
                          {allergen}
                          <X
                            className="w-4 h-4 cursor-pointer hover:text-red-600"
                            onClick={() => removeAllergen(allergen)}
                          />
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add new allergen (e.g., Nuts)"
                      className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    />
                  </div>
                </div>
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

            {/* Right - Live Preview */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Preview</h3>

                <div className="space-y-6">
                  <div className="bg-gray-200 rounded-xl h-64 relative overflow-hidden">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gray-300 border-2 border-dashed rounded-xl" />
                    )}
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900">Signature Dish Name</h2>
                  <p className="text-gray-700">
                    A brief, appetizing description of the dish, highlighting key ingredients and flavor profile.
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-red-600">NPR 1990</span>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Main Course</span>
                      <span className="text-green-600">Available</span>
                      <span>20 min</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Sizes:</span> Medium
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Extras:</span> Add Bacon
                    </p>
                    <div className="flex gap-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Dairy</span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Gluten</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}