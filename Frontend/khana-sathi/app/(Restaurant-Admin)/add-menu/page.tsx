"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Upload,
  X,
  Loader2,
  ArrowLeft,
  Utensils
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";

export default function AddMenuItem() {
  const { user } = useAuth();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Main Course",
    price: "",
    preparationTime: "20",
    isAvailable: true,
  });

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

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in name and price");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/menu`,
        {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: Number(formData.price),
          preparationTime: Number(formData.preparationTime),
          image: imagePreview || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success("Menu item added successfully!");
      router.push("/menu");
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast.error(error.response?.data?.message || "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/menu")}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-orange-600 hover:border-orange-500 transition shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">Create New Dish</h1>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded inline-block">Kitchen Inventory</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-2xl font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
            {saving ? "Deploying..." : "Add to Menu"}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Image Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center sticky top-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Dish Representation</p>
              <label className="group relative cursor-pointer block">
                <div className="aspect-square border-4 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group-hover:border-orange-200 transition-all overflow-hidden bg-gray-50/50">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-orange-400" />
                      </div>
                      <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Upload Photo</span>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreview && (
                <button
                  onClick={() => setImagePreview(null)}
                  className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition"
                >
                  Remove Illustration
                </button>
              )}
              <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                High quality images increase conversion by up to 40%
              </p>
            </div>
          </div>

          {/* Right: Form Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10">
              <div className="space-y-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dish Title</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Name of your culinary masterpiece..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipe Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="What makes this dish special? Mention ingredients, spice levels, etc."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer"
                    >
                      <option>Main Course</option>
                      <option>Appetizers</option>
                      <option>Desserts</option>
                      <option>Beverages</option>
                      <option>Snacks</option>
                      <option>Breakfast</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Price (NPR)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">Rs.</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Preparation Logistics</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estimated Time (Mins)</label>
                    <input
                      type="number"
                      name="preparationTime"
                      value={formData.preparationTime}
                      onChange={handleInputChange}
                      className="w-full px-6 py-3 bg-white border border-orange-100 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-[10px] text-orange-600 font-bold uppercase mt-3 tracking-tight">Time will be factored into customer delivery estimates</p>
                </div>
              </div>
            </div>

            {/* Mobile Mobile Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:hidden flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-5 rounded-2xl font-bold transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? "Deploying..." : "Add to Menu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}