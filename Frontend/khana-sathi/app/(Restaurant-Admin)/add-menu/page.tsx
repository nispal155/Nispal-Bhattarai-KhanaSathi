"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Tag,
  FileText,
  Users,
  Settings,
  LogOut,
  Upload,
  X,
  Loader2,
  Wallet,
  User,
  ArrowLeft,
} from "lucide-react";

const API_URL = "http://localhost:5003/api";

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
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: "None",
    allergens: [] as string[],
    calories: "",
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
          isVegetarian: formData.isVegetarian,
          isVegan: formData.isVegan,
          isGlutenFree: formData.isGlutenFree,
          spiceLevel: formData.spiceLevel,
          allergens: formData.allergens,
          calories: formData.calories ? Number(formData.calories) : undefined,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/menu")} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Menu Item</h1>
        </div>
      </header>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Item Photo */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Item Photo</label>
              <label className="cursor-pointer inline-block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl w-48 h-48 flex flex-col items-center justify-center gap-4 hover:border-red-400 transition overflow-hidden">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
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
                placeholder="e.g., Chicken Momo"
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="A brief description of the dish..."
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
              />
            </div>

            {/* Category & Price */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option>Main Course</option>
                  <option>Appetizer</option>
                  <option>Dessert</option>
                  <option>Beverage</option>
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
                  placeholder="e.g., 250"
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>
            </div>

            {/* Prep Time & Calories */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Time (minutes)</label>
                <input
                  type="number"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calories (optional)</label>
                <input
                  type="number"
                  name="calories"
                  value={formData.calories}
                  onChange={handleInputChange}
                  placeholder="e.g., 350"
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>
            </div>

            {/* Spice Level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Spice Level</label>
              <div className="flex flex-wrap gap-3">
                {['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, spiceLevel: level }))}
                    className={`px-4 py-2 rounded-full border-2 transition font-medium ${formData.spiceLevel === level
                        ? level === 'None' ? 'border-gray-500 bg-gray-500 text-white'
                          : level === 'Mild' ? 'border-yellow-500 bg-yellow-500 text-white'
                            : level === 'Medium' ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                  >
                    {level === 'None' ? '🚫 None' : level === 'Mild' ? '🌶️ Mild' : level === 'Medium' ? '🌶️🌶️ Medium' : level === 'Hot' ? '🔥 Hot' : '🔥🔥 Extra Hot'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Dietary Options</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVegetarian: e.target.checked }))}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <span className="text-gray-700">🥬 Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVegan: e.target.checked }))}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                  <span className="text-gray-700">🌱 Vegan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGlutenFree}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGlutenFree: e.target.checked }))}
                    className="w-5 h-5 text-amber-500 rounded"
                  />
                  <span className="text-gray-700">🌾 Gluten-Free</span>
                </label>
              </div>
            </div>

            {/* Allergens */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Allergens (select all that apply)</label>
              <div className="flex flex-wrap gap-3">
                {['Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 'Peanuts', 'Wheat', 'Soy', 'Sesame'].map(allergen => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        allergens: prev.allergens.includes(allergen)
                          ? prev.allergens.filter(a => a !== allergen)
                          : [...prev.allergens, allergen]
                      }));
                    }}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition ${formData.allergens.includes(allergen)
                        ? 'border-orange-500 bg-orange-100 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
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
                {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}