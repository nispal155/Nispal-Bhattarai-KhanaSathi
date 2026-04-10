"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Clock, MapPin, Phone, ShoppingCart, Plus, Minus, Loader2, ArrowLeft, AlertCircle, Users, ChevronDown } from "lucide-react";
import { useState, useEffect, use, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
import { getRestaurantById } from "@/lib/restaurantService";
import { getRestaurantMenu, MenuItem } from "@/lib/menuService";
import { addItemToChildCartRequest, addToCart, clearCart } from "@/lib/cartService";
import { getMyGroupCarts, addItemToGroupCart, GroupCart } from "@/lib/groupCartService";
import { formatPriceRange } from "@/lib/formatters";
import toast from "react-hot-toast";

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
  specialInstructions?: string;
}

type RecommendedMenuItem = MenuItem & {
  recommendationScore: number;
  recommendationReasons: string[];
};

const formatChildLimits = (childProfile?: {
  spendingLimits?: { daily?: number | null; weekly?: number | null; monthly?: number | null };
}) => {
  const limits = childProfile?.spendingLimits;
  const summary: string[] = [];

  if (limits?.daily !== null && limits?.daily !== undefined) summary.push(`Daily budget: Rs. ${limits.daily}`);
  if (limits?.weekly !== null && limits?.weekly !== undefined) summary.push(`Weekly budget: Rs. ${limits.weekly}`);
  if (limits?.monthly !== null && limits?.monthly !== undefined) summary.push(`Monthly budget: Rs. ${limits.monthly}`);

  return summary;
};

const formatChildRestrictions = (childProfile?: {
  foodRestrictions?: { blockJunkFood?: boolean; blockCaffeine?: boolean; blockedAllergens?: string[] };
}) => {
  const restrictions = childProfile?.foodRestrictions;
  const summary: string[] = [];

  if (restrictions?.blockJunkFood) summary.push("Junk food hidden");
  if (restrictions?.blockCaffeine) summary.push("Caffeinated items hidden");
  if (restrictions?.blockedAllergens?.length) {
    summary.push(`Blocked allergens: ${restrictions.blockedAllergens.join(", ")}`);
  }

  return summary;
};

const scoreRecommendedMeal = (item: MenuItem): RecommendedMenuItem => {
  const reasons = new Set<string>();
  let score = 0;

  if (!item.isJunkFood) {
    score += 3;
    reasons.add("Not marked as junk food");
  }

  if (!item.containsCaffeine) {
    score += 1;
    reasons.add("Caffeine-free");
  }

  if (typeof item.calories === "number") {
    if (item.calories <= 450) {
      score += 3;
    } else if (item.calories <= 650) {
      score += 2;
    } else {
      score -= 1;
    }
    reasons.add(`${item.calories} kcal`);
  }

  if (item.isVegetarian) {
    score += 1;
    reasons.add("Vegetarian");
  }

  if (item.isVegan) {
    score += 1;
    reasons.add("Vegan");
  }

  if (item.isGlutenFree) {
    score += 1;
    reasons.add("Gluten-free");
  }

  if (item.preparationTime > 0 && item.preparationTime <= 20) {
    score += 0.5;
    reasons.add("Quick prep");
  }

  return {
    ...item,
    recommendationScore: score,
    recommendationReasons: [...reasons].slice(0, 3)
  };
};

export default function ViewRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const childCartId = searchParams.get("childCartId") || "";
  const isParentEditingChildCart = user?.role === "customer" && Boolean(childCartId);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeGroupCarts, setActiveGroupCarts] = useState<GroupCart[]>([]);
  const [selectedGroupCart, setSelectedGroupCart] = useState<string>("");
  const [addingToGroupCart, setAddingToGroupCart] = useState(false);
  const [showGroupCartPicker, setShowGroupCartPicker] = useState(false);

  const fetchActiveGroupCarts = useCallback(async () => {
    if (user?.role === 'child' || isParentEditingChildCart) {
      setActiveGroupCarts([]);
      setSelectedGroupCart("");
      return;
    }

    try {
      const res = await getMyGroupCarts();
      const carts = res.data?.data || [];
      const active = (Array.isArray(carts) ? carts : []).filter(
        (gc: GroupCart) => gc.status === 'open'
      );
      setActiveGroupCarts(active);
      if (active.length > 0 && !selectedGroupCart) {
        setSelectedGroupCart(active[0]._id);
      }
    } catch {
      // silent — group cart is optional
    }
  }, [isParentEditingChildCart, selectedGroupCart, user?.role]);

  const fetchData = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchActiveGroupCarts();
  }, [fetchData, fetchActiveGroupCarts]);

  const categories = ["All", ...new Set(menuItems.map(item => item.category))];

  const filteredMenu = selectedCategory === "All"
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);
  const childLimitSummary = formatChildLimits(user?.childProfile);
  const childRestrictionSummary = formatChildRestrictions(user?.childProfile);
  const recommendedMeals = user?.role === "child"
    ? menuItems
      .filter((item) => item.isAvailable)
      .map(scoreRecommendedMeal)
      .filter((item) => item.recommendationScore >= 3)
      .sort((a, b) => {
        if (b.recommendationScore !== a.recommendationScore) {
          return b.recommendationScore - a.recommendationScore;
        }

        if (typeof a.calories === "number" && typeof b.calories === "number") {
          return a.calories - b.calories;
        }

        return a.price - b.price;
      })
      .slice(0, 3)
    : [];

  const updateLocalCart = (menuItem: MenuItem, change: number, instructions?: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.menuItem._id === menuItem._id);
      if (existing) {
        const newQty = existing.quantity + change;
        if (newQty <= 0) {
          return prev.filter(item => item.menuItem._id !== menuItem._id);
        }
        return prev.map(item =>
          item.menuItem._id === menuItem._id
            ? { ...item, quantity: newQty, specialInstructions: instructions ?? item.specialInstructions }
            : item
        );
      } else if (change > 0) {
        return [...prev, { menuItem, quantity: change, specialInstructions: instructions }];
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

  const handleAddToCart = async (forceReplace = false) => {
    if (cartItems.length === 0) return;

    try {
      setAddingToCart(true);

      if (isParentEditingChildCart) {
        for (const item of cartItems) {
          const response = await addItemToChildCartRequest(
            childCartId,
            item.menuItem._id,
            item.quantity,
            item.specialInstructions
          );

          if (response.error) {
            toast.error(response.error);
            return;
          }
        }

        setCartItems([]);
        toast.success("Items added to the approved child cart!");
        return;
      }

      // If replacing, clear the old cart first
      if (forceReplace) {
        const clearResponse = await clearCart();
        if (clearResponse.error) {
          toast.error(clearResponse.error);
          return;
        }
      }

      // Add each item to cart via API
      for (const item of cartItems) {
        const response = await addToCart(item.menuItem._id, item.quantity, item.specialInstructions);
        if (response.error) {
          if (response.errorCode === 'DIFFERENT_RESTAURANT') {
            const existingName = (response.details as { existingRestaurant?: string } | undefined)?.existingRestaurant || 'another restaurant';
            const confirmed = window.confirm(
              `Your cart has items from ${existingName}. Do you want to clear it and add items from ${restaurant?.name || 'this restaurant'} instead?`
            );
            if (confirmed) {
              await handleAddToCart(true);
              return;
            }

            toast("Cart was not changed.");
            return;
          }

          toast.error(response.error);
          return;
        }
      }
      // Clear local cart after adding
      setCartItems([]);
      toast.success("Items added to cart!");
    } catch {
      toast.error("Failed to add items to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToGroupCart = async () => {
    if (cartItems.length === 0 || !selectedGroupCart) return;
    try {
      setAddingToGroupCart(true);
      for (const item of cartItems) {
        const response = await addItemToGroupCart(selectedGroupCart, item.menuItem._id, item.quantity, item.specialInstructions);
        if (response.error) {
          toast.error(response.error);
          return;
        }
      }
      setCartItems([]);
      toast.success('Items added to group cart!');
    } catch {
      toast.error('Failed to add items to group cart');
    } finally {
      setAddingToGroupCart(false);
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
      <UserHeader />

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
                <span className="font-medium">{formatPriceRange(restaurant.priceRange || "Rs.Rs.")}</span>
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

              {user?.role === "child" && (childRestrictionSummary.length > 0 || childLimitSummary.length > 0) && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Parental controls are active on this account</p>
                  <div className="flex flex-wrap gap-2">
                    {childRestrictionSummary.map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full bg-white text-red-700 text-xs border border-red-200">
                        {item}
                      </span>
                    ))}
                    {childLimitSummary.map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full bg-white text-gray-700 text-xs border border-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isParentEditingChildCart && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Editing an approved child cart</p>
                  <p className="text-sm text-blue-800">
                    Items added here will go into the child request waiting in your parent cart review flow.
                  </p>
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
            {user?.role === "child" && recommendedMeals.length > 0 && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-lime-50 to-white p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Recommended meals for healthier habits</p>
                    <p className="text-sm text-emerald-800 mt-1">
                      These options are picked from the menu you are allowed to see and lean toward lighter choices.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-white/80 border border-emerald-100 px-3 py-1 rounded-full">
                    Parent-safe picks
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedMeals.map((item) => (
                    <div key={item._id} className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Rs. {item.price}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.recommendationReasons.map((reason) => (
                          <span
                            key={`${item._id}-${reason}`}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-100"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => updateLocalCart(item, 1)}
                        className="mt-4 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-medium transition-colors"
                      >
                        {getItemQuantity(item._id) > 0 ? `Add More (${getItemQuantity(item._id)})` : "Add to Cart"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {user?.role === "child"
                  ? "No menu items available here after parental-control filters were applied."
                  : "No menu items available in this category."}
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

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {item.isVegetarian && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Veg</span>
                          )}
                          {!item.isVegetarian && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Non-Veg</span>
                          )}
                          {item.isVegan && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Vegan</span>
                          )}
                          {item.isGlutenFree && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">GF</span>
                          )}
                          {item.isJunkFood && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">Junk Food</span>
                          )}
                          {item.containsCaffeine && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Caffeine</span>
                          )}
                          {item.spiceLevel && (
                            <span className="text-xs flex items-center gap-0.5">
                              {Array.from({ length: item.spiceLevel === 'extra_hot' ? 3 : item.spiceLevel === 'hot' ? 2 : 1 }).map((_, i) => (
                                <span key={i}>🌶️</span>
                              ))}
                            </span>
                          )}
                          {item.calories && (
                            <span className="text-xs text-gray-500">{item.calories} kcal</span>
                          )}
                          {item.preparationTime && (
                            <span className="text-xs text-gray-400">⏱️ {item.preparationTime}m</span>
                          )}
                        </div>

                        {item.allergens && item.allergens.length > 0 && (
                          <div className="mt-1">
                            <p className="text-[10px] text-gray-500 font-medium italic">
                              Allergens: {item.allergens.join(", ")}
                            </p>
                            {user?.allergyPreferences?.some((allergy: string) => item.allergens?.includes(allergy)) && (
                              <div className="flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-orange-50 border border-orange-100 rounded text-[10px] text-orange-700 font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>Contains your allergen!</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <span className="font-semibold text-gray-900">Rs. {item.price}</span>

                          {item.isAvailable ? (
                            <div className="flex flex-col gap-2">
                              {getItemQuantity(item._id) > 0 ? (
                                <div className="flex flex-col gap-2">
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
                                  <input
                                    type="text"
                                    placeholder="Add instructions..."
                                    className="text-xs border rounded px-2 py-1 w-full"
                                    value={cartItems.find(i => i.menuItem._id === item._id)?.specialInstructions || ""}
                                    onChange={(e) => updateLocalCart(item, 0, e.target.value)}
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => updateLocalCart(item, 1)}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
                                >
                                  Add
                                </button>
                              )}
                            </div>
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
                  onClick={() => handleAddToCart()}
                  disabled={addingToCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingToCart ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {isParentEditingChildCart ? `Add to Child Cart (${cartCount} items)` : `Add to Cart (${cartCount} items)`}
                    </>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center hover:bg-gray-50"
                >
                  {isParentEditingChildCart ? "Back to Child Requests" : "View Cart"}
                </Link>

                {/* Add to Group Cart */}
                {user?.role !== 'child' && !isParentEditingChildCart && activeGroupCarts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-gray-700">Add to Group Cart</span>
                    </div>

                    {activeGroupCarts.length === 1 ? (
                      <div className="bg-red-50 rounded-lg px-3 py-2 mb-3">
                        <p className="text-sm font-medium text-gray-800 truncate">{activeGroupCarts[0].name}</p>
                        <p className="text-xs text-gray-500">
                          {activeGroupCarts[0].members?.length || 1} members · Code: {activeGroupCarts[0].inviteCode}
                        </p>
                      </div>
                    ) : (
                      <div className="relative mb-3">
                        <button
                          onClick={() => setShowGroupCartPicker(!showGroupCartPicker)}
                          className="w-full flex items-center justify-between bg-red-50 rounded-lg px-3 py-2.5 text-sm text-left"
                        >
                          <span className="font-medium text-gray-800 truncate">
                            {activeGroupCarts.find(gc => gc._id === selectedGroupCart)?.name || 'Select group cart'}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        </button>
                        {showGroupCartPicker && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                            {activeGroupCarts.map(gc => (
                              <button
                                key={gc._id}
                                onClick={() => { setSelectedGroupCart(gc._id); setShowGroupCartPicker(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition ${
                                  selectedGroupCart === gc._id ? 'bg-red-50 text-red-600' : 'text-gray-700'
                                }`}
                              >
                                <p className="font-medium truncate">{gc.name}</p>
                                <p className="text-xs text-gray-400">{gc.members?.length || 1} members</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleAddToGroupCart}
                      disabled={addingToGroupCart || !selectedGroupCart}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {addingToGroupCart ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Add to Group Cart ({cartCount})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Footer */}

    </div>
  );
}
