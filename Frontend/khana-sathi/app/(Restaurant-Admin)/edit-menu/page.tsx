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
  Save,
  Trash2,
  Utensils
} from "lucide-react";
import { updateMenuItem } from "@/lib/menuService";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";

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

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in name and price");
      return;
    }

    if (!itemId) return;

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">Modify Entrée</h1>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded inline-block">Item ID: {itemId?.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-2xl font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Updating..." : "Record Changes"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-10">
              <div className="space-y-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entrée Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Market Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">List Price (NPR)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">Rs.</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Consumer Availability</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Hide from menu temporarily</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition duration-300 ${formData.isAvailable ? "bg-green-500 shadow-sm shadow-green-200" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm ${formData.isAvailable ? "translate-x-7" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:hidden flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-5 rounded-2xl font-bold transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Record Changes"}
            </button>
          </div>

          {/* Right: Live Preview & Image */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-video bg-gray-100 relative group">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <Utensils className="w-12 h-12" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                  <div className="bg-white/90 p-3 rounded-2xl shadow-xl flex items-center gap-2">
                    <Upload className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Swap Image</span>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <div className="p-8">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{formData.category}</p>
                <h3 className="text-xl font-black text-gray-800 mb-2 truncate">{formData.name || "Unnamed Item"}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6 font-medium">{formData.description || "No description provided."}</p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="text-xl font-black text-gray-800">Rs. {formData.price || "0"}</div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                    <Loader2 className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase">{formData.preparationTime} MINS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 border border-blue-100 border-dashed rounded-[2rem]">
              <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed text-center">
                Editing this item will update the listing across all active customer carts in near-realtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditMenuItem() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>}>
      <EditMenuItemContent />
    </Suspense>
  );
}