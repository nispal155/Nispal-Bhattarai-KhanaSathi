"use client";

import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Upload,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { updateMenuItem } from "@/lib/menuService";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import axios from "axios";

const API_URL = "http://localhost:5003/api";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  preparationTime: number;
}

function EditMenuItemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Main Course",
    price: "",
    preparationTime: "20",
    isAvailable: true,
  });

  useEffect(() => {
    if (!itemId) {
      toast.error("No menu item ID provided");
      router.push("/menu");
      return;
    }
    fetchMenuItem();
  }, [itemId]);

  const fetchMenuItem = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const item = response.data.data;

      setFormData({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "Main Course",
        price: String(item.price || ""),
        preparationTime: String(item.preparationTime || "20"),
        isAvailable: item.isAvailable ?? true,
      });
      setImagePreview(item.image || null);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      toast.error("Failed to load menu item");
      router.push("/menu");
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in name and price");
      return;
    }

    if (!itemId) {
      toast.error("No menu item ID");
      return;
    }

    setSaving(true);
    try {
      await updateMenuItem(itemId, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        preparationTime: Number(formData.preparationTime),
        image: imagePreview || "",
        isAvailable: formData.isAvailable,
      });
      toast.success("Menu item updated successfully!");
      router.push("/menu");
    } catch (error: any) {
      console.error("Error updating menu item:", error);
      toast.error(error.response?.data?.message || "Failed to update menu item");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <RestaurantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RestaurantSidebar />

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/menu")}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Menu Item</h1>
          </div>
        </header>

        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left - Form */}
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>

                {/* Item Photo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Item Photo</label>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl w-48 h-48 flex flex-col items-center justify-center gap-4 hover:border-red-400 transition relative overflow-hidden">
                      {imagePreview ? (
                        <>
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 z-10"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gray-400" />
                          <span className="text-blue-600 font-medium">Upload Image</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>

                {/* Item Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                    placeholder="Enter item name"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
                    placeholder="Describe your dish"
                  />
                </div>

                {/* Category & Price */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option>Main Course</option>
                      <option>Appetizers</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                      <option>Sides</option>
                      <option>Snacks</option>
                      <option>Breakfast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (NPR) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Options</h3>

                <div className="space-y-6">
                  {/* Prep Time & Calories */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (min)</label>
                      <input
                        type="number"
                        name="preparationTime"
                        value={formData.preparationTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                      />
                    </div>
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-700 font-medium">🟢 Available Now</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${formData.isAvailable ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${formData.isAvailable ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => router.push("/menu")}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Right - Live Preview */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h3>

                <div className="space-y-6">
                  <div className="bg-gray-200 rounded-xl h-48 relative overflow-hidden">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{formData.name || "Item Name"}</h2>
                    <p className="text-gray-600 mt-2">{formData.description || "Item description will appear here"}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-red-600">NPR {formData.price || "0"}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">{formData.category}</span>
                      <span className={formData.isAvailable ? "text-green-600" : "text-red-600"}>
                        {formData.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{formData.preparationTime} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditMenuItem() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-500" /></div>}>
      <EditMenuItemContent />
    </Suspense>
  );
}