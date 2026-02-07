"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Edit2,
  Trash2,
  Loader2,
  Plus,
  Flame,
  Clock,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { getMyMenu, updateMenuItem, deleteMenuItem } from "@/lib/menuService";

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string;
  allergens?: string[];
  preparationTime?: number;
  calories?: number;
}

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await getMyMenu();
      const responseData = response?.data as any;
      const menuData = responseData?.data || responseData || [];
      if (Array.isArray(menuData)) {
        setMenuItems(menuData);
      } else if (typeof menuData === 'object') {
        const flatMenu: MenuItem[] = [];
        Object.values(menuData).forEach((items) => {
          if (Array.isArray(items)) {
            flatMenu.push(...(items as MenuItem[]));
          }
        });
        setMenuItems(flatMenu);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      setUpdating(item._id);
      await updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(m =>
        m._id === item._id ? { ...m, isAvailable: !m.isAvailable } : m
      ));
    } catch (err) {
      console.error("Error updating item:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      setDeleting(itemId);
      await deleteMenuItem(itemId);
      setMenuItems(prev => prev.filter(m => m._id !== itemId));
    } catch (err) {
      console.error("Error deleting item:", err);
    } finally {
      setDeleting(null);
    }
  };

  const categories = ["all", ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    if (showInStockOnly && !item.isAvailable) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-bold uppercase tracking-tight">Menu Management</h1>
            <p className="text-gray-500">Manage your dishes, prices, and availability.</p>
          </div>
          <Link href="/add-menu" className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add New Item
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-6 mb-8 bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 text-sm font-semibold text-gray-700 outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInStockOnly(!showInStockOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${showInStockOnly ? "bg-red-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${showInStockOnly ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-bold text-gray-600">In Stock Only</span>
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
            <UtensilsCrossed className="w-4 h-4" /> {filteredItems.length} Items Found
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 mb-4 font-medium">No menu items found matching your filters</p>
            <Link href="/add-menu" className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition">
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <div className="h-44 bg-gray-100 relative group">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <UtensilsCrossed className="w-10 h-10 text-gray-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {item.isVegetarian && (
                      <span className="px-2 py-0.5 bg-green-500/90 backdrop-blur-sm text-white text-[10px] rounded-md font-bold flex items-center gap-1 uppercase">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    )}
                    {!item.isVegetarian && !item.isVegan && (
                      <span className="px-2 py-0.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] rounded-md font-bold uppercase">Non-Veg</span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                    <span className="text-sm font-bold text-red-600">Rs {item.price}</span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[32px]">{item.description || "No description available."}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded uppercase">{item.category}</span>
                    {item.preparationTime && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <Clock className="w-3 h-3" /> {item.preparationTime}M
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={updating === item._id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${item.isAvailable ? "bg-green-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${item.isAvailable ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <span className={`text-[10px] font-bold uppercase ${item.isAvailable ? "text-green-600" : "text-gray-400"}`}>
                        {item.isAvailable ? "Live" : "Out"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/edit-menu?id=${item._id}`} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleting === item._id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        {deleting === item._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}