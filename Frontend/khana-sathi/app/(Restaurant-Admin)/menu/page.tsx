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
import RestaurantSidebar from "@/components/RestaurantSidebar";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const menuData = responseData?.data || responseData || [];
      // Handle both flat array and categorized object
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

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    if (showInStockOnly && !item.isAvailable) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <RestaurantSidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage all your delicious menu items, their prices, and availability.</p>
          </div>
          <Link href="/add-menu" className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold shadow-lg transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Menu Item
          </Link>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-6 mb-10 items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-6 py-4 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-700"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
                  ))}
                </select>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowInStockOnly(!showInStockOnly)}
                    className={`relative inline-flex h-9 w-16 items-center rounded-full transition ${showInStockOnly ? "bg-red-500" : "bg-gray-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white transition ${showInStockOnly ? "translate-x-8" : "translate-x-1"
                        }`}
                    />
                  </button>
                  <span className="text-gray-700 font-medium">Show In Stock Only</span>
                </div>

                <div className="ml-auto">
                  <span className="text-gray-600">{filteredItems.length} items</span>
                </div>
              </div>

              {/* Menu Grid */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 mb-4">No menu items found</p>
                  <Link href="/add-menu" className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition">
                    Add Your First Menu Item
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredItems.map((item) => (
                    <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                      {/* Image */}
                      <div className="h-48 bg-gray-200 relative">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        {/* Dietary Badges */}
                        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                          {item.isVegetarian && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                              <Leaf className="w-3 h-3" /> Veg
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full font-medium">Vegan</span>
                          )}
                          {item.isGlutenFree && (
                            <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">GF</span>
                          )}
                        </div>
                        {/* Non-Veg Indicator */}
                        {!item.isVegetarian && !item.isVegan && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 border-2 border-red-700 rounded-sm" title="Non-Vegetarian" />
                        )}
                        {/* Spice Level */}
                        {item.spiceLevel && item.spiceLevel !== 'None' && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                            <Flame className={`w-3 h-3 ${item.spiceLevel === 'Mild' ? 'text-yellow-400' : item.spiceLevel === 'Medium' ? 'text-orange-400' : 'text-red-500'}`} />
                            {item.spiceLevel}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                        )}

                        {/* Info Row: Category, Prep Time, Calories */}
                        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-full">{item.category}</span>
                          {item.preparationTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {item.preparationTime}m
                            </span>
                          )}
                          {item.calories && (
                            <span>{item.calories} cal</span>
                          )}
                        </div>

                        {/* Allergens */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="flex items-center gap-1 mb-3">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-600 truncate">
                              {item.allergens.slice(0, 3).join(', ')}{item.allergens.length > 3 ? '...' : ''}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-red-600">Rs. {item.price}</span>
                        </div>

                        {/* Stock Toggle & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAvailability(item)}
                              disabled={updating === item._id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${item.isAvailable ? "bg-green-500" : "bg-gray-300"
                                } ${updating === item._id ? "opacity-50" : ""}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${item.isAvailable ? "translate-x-6" : "translate-x-1"
                                  }`}
                              />
                            </button>
                            <span className={`text-xs font-medium ${item.isAvailable ? "text-green-700" : "text-gray-500"}`}>
                              {item.isAvailable ? "In Stock" : "Out"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Link href={`/edit-menu?id=${item._id}`} className="text-gray-500 hover:text-blue-600 transition">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={deleting === item._id}
                              className="text-gray-500 hover:text-red-600 transition disabled:opacity-50"
                            >
                              {deleting === item._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          © 2025 KhanaSathi Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
}