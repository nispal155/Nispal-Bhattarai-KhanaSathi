"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Star,
  Tag,
  FileText,
  Users,
  MessageCircle,
  Package,
  Settings,
  LogOut,
  Edit2,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { getMyMenu, updateMenuItem, deleteMenuItem } from "@/lib/menuService";

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  preparationTime?: number;
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
            <a href="/menu" className="flex items-center gap-4 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
              <UtensilsCrossed className="w-5 h-5" />
              Menu
            </a>
            <a href="/orders-board" className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
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
              <span className="text-2xl font-bold">रु</span>
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
                className={`relative inline-flex h-9 w-16 items-center rounded-full transition ${
                  showInStockOnly ? "bg-red-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white transition ${
                    showInStockOnly ? "translate-x-8" : "translate-x-1"
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
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Image */}
                <div className="h-56 bg-gray-200 relative">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {item.isVegetarian && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">Veg</span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {item.category}
                    </span>
                    <span className="text-xl font-bold text-gray-900">Rs. {item.price}</span>
                  </div>

                  {/* Stock Toggle & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={updating === item._id}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                          item.isAvailable ? "bg-red-500" : "bg-gray-300"
                        } ${updating === item._id ? "opacity-50" : ""}`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                            item.isAvailable ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className={`text-sm font-medium ${item.isAvailable ? "text-green-700" : "text-gray-500"}`}>
                        {item.isAvailable ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Link href={`/edit-menu?id=${item._id}`} className="text-gray-600 hover:text-blue-600 transition">
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        disabled={deleting === item._id}
                        className="text-gray-600 hover:text-red-600 transition disabled:opacity-50"
                      >
                        {deleting === item._id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
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