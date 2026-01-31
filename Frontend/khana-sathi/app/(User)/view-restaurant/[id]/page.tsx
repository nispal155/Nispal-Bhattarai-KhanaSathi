"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Clock, MapPin, Phone, ShoppingCart, Plus, Minus, Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect, use } from "react";
import { getRestaurantById } from "@/lib/restaurantService";
import { getRestaurantMenu, MenuItem } from "@/lib/menuService";
import { addToCart } from "@/lib/cartService";

interface Restaurant {
  _id: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
  };
  cuisineType: string[];
  openingHour: string;
  closingHour: string;
  contactPhone: string;
  logoUrl?: string;
  averageRating: number;
  reviewCount: number;
  deliveryTime: {
    min: number;
    max: number;
  };
  priceRange: string;
  tags: string[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function ViewRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restaurantRes, menuRes] = await Promise.all([
        getRestaurantById(id),
        getRestaurantMenu(id),
      ]);
      // Handle nested response structure
      const restaurantData = restaurantRes?.data?.data || restaurantRes?.data;
      const menuData = menuRes?.data?.data || menuRes?.data;

      setRestaurant(restaurantData as Restaurant);

      // Handle menu data - could be array or object with categories
      if (Array.isArray(menuData)) {
        setMenuItems(menuData as MenuItem[]);
      } else if (menuData && typeof menuData === 'object') {
        // Flatten if it's categorized
        const items = Object.values(menuData).flat() as MenuItem[];
        setMenuItems(items);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load restaurant details");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  const filteredMenu = selectedCategory === "All"
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const updateLocalCart = (menuItem: MenuItem, change: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.menuItem._id === menuItem._id);
      if (existing) {
        const newQty = existing.quantity + change;
        if (newQty <= 0) {
          return prev.filter(item => item.menuItem._id !== menuItem._id);
        }
        return prev.map(item =>
          item.menuItem._id === menuItem._id
            ? { ...item, quantity: newQty }
            : item
        );
      } else if (change > 0) {
        return [...prev, { menuItem, quantity: change }];
      }
      return prev;
    });
  };

  const getItemQuantity = (itemId: string) => {
    const item = cartItems.find(i => i.menuItem._id === itemId);
    return item?.quantity || 0;
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = async () => {
    if (cartItems.length === 0) return;

    try {
      setAddingToCart(true);
      // Add each item to cart via API
      for (const item of cartItems) {
        await addToCart(item.menuItem._id, item.quantity);
      }
      // Clear local cart after adding
      setCartItems([]);
      alert("Items added to cart!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to add items to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Restaurant not found"}</p>
        <Link href="/browse-restaurants" className="text-red-500 hover:underline">
          Back to Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍜</span>
              </div>
              <div>
                <span className="text-red-500 font-bold text-lg">Khana Sathi</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/user-profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>👤</span> Profile
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 overflow-hidden">
              <Image src="/avatar.jpg" alt="Profile" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </div>
      </nav>

      {/* Restaurant Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/browse-restaurants" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Restaurants
          </Link>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 rounded-xl bg-gray-200 overflow-hidden shrink-0">
              <Image
                src={restaurant.logoUrl || "/restaurant-placeholder.jpg"}
                alt={restaurant.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{restaurant.averageRating?.toFixed(1) || "New"}</span>
                  <span className="text-gray-400">({restaurant.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.deliveryTime?.min || 30}-{restaurant.deliveryTime?.max || 45} min</span>
                </div>
                <span className="font-medium">{restaurant.priceRange || "$$"}</span>
              </div>

              <p className="text-gray-600 mb-2">
                {restaurant.cuisineType?.join(", ") || "Various Cuisines"}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address?.addressLine1}, {restaurant.address?.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{restaurant.contactPhone}</span>
                </div>
              </div>

              {restaurant.tags && restaurant.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {restaurant.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Menu Section */}
          <main className="flex-1">
            {/* Categories */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                      ? "bg-red-500 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            {filteredMenu.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No menu items available in this category.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenu.map((item) => (
                  <div
                    key={item._id}
                    className={`bg-white rounded-xl border border-gray-200 p-4 ${!item.isAvailable ? 'opacity-60' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                        <Image
                          src={item.image || "/food-placeholder.jpg"}
                          alt={item.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          {item.isVegetarian && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Veg</span>
                          )}
                          {item.isVegan && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Vegan</span>
                          )}
                          {item.isGlutenFree && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">GF</span>
                          )}
                          {item.spiceLevel && Number(item.spiceLevel) > 0 && (
                            <span className="text-xs">{"🌶️".repeat(Number(item.spiceLevel))}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="font-semibold text-gray-900">Rs. {item.price}</span>

                          {item.isAvailable ? (
                            getItemQuantity(item._id) > 0 ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateLocalCart(item, -1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-medium w-6 text-center">
                                  {getItemQuantity(item._id)}
                                </span>
                                <button
                                  onClick={() => updateLocalCart(item, 1)}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => updateLocalCart(item, 1)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
                              >
                                Add
                              </button>
                            )
                          ) : (
                            <span className="text-sm text-gray-500">Unavailable</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Cart Summary Sidebar */}
          {cartCount > 0 && (
            <aside className="lg:w-80">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Your Order</h2>

                <div className="space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.menuItem._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-gray-700">{item.menuItem.name}</span>
                      </div>
                      <span className="text-sm font-medium">Rs. {item.menuItem.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>Rs. {cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingToCart ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart ({cartCount} items)
                    </>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center hover:bg-gray-50"
                >
                  View Cart
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Footer */}

    </div>
  );
}
