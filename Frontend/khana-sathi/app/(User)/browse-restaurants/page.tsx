"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Clock, Star, ChevronDown, Loader2, ShieldAlert, Store, UtensilsCrossed } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllRestaurants, getNearbyRestaurants, Restaurant } from "@/lib/restaurantService";
import { searchMenuItems, type MenuItem } from "@/lib/menuService";
import { formatPriceRange } from "@/lib/formatters";
import UserHeader from "@/components/layout/UserHeader";
import { getProfile, type UserProfile as ServiceUserProfile } from "@/lib/userService";

type BrowseProfile = ServiceUserProfile & {
  address?: {
    city?: string;
  };
  city?: string;
};

interface RestaurantDisplay {
  _id: string;
  slug: string;
  image: string;
  name: string;
  rating: number;
  cuisine: string;
  priceRange: string;
  deliveryTime: string;
  tags: string[];
}

interface FoodSearchDisplay {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  restaurantCuisine: string;
  restaurantPriceRange: string;
  restaurantDeliveryTime: string;
}

const mapRestaurantToDisplay = (restaurant: Restaurant): RestaurantDisplay => ({
  _id: restaurant._id,
  slug: restaurant._id,
  image: restaurant.logoUrl || "/restaurant-placeholder.jpg",
  name: restaurant.name,
  rating: restaurant.averageRating || 0,
  cuisine: restaurant.cuisineType?.join(", ") || "Various",
  priceRange: formatPriceRange(restaurant.priceRange || "Rs.Rs."),
  deliveryTime: restaurant.deliveryTime ? `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min` : "30-45 min",
  tags: restaurant.tags || [],
});

const applyRestaurantFilters = (
  restaurantList: RestaurantDisplay[],
  cuisineFilters: string[],
  ratingFilter: string,
  deliveryFilter: string,
  allergyFilters: string[]
) => restaurantList.filter((restaurant) => {
  if (cuisineFilters.length > 0 && !cuisineFilters.some((cuisine) => restaurant.cuisine.includes(cuisine))) {
    return false;
  }

  if (ratingFilter === "4+" && restaurant.rating < 4) return false;
  if (ratingFilter === "3+" && restaurant.rating < 3) return false;

  if (deliveryFilter === "30") {
    const minTime = parseInt(restaurant.deliveryTime.split("-")[0], 10);
    if (minTime >= 30) return false;
  }

  if (deliveryFilter === "60") {
    const minTime = parseInt(restaurant.deliveryTime.split("-")[0], 10);
    if (minTime < 30 || minTime > 60) return false;
  }

  if (allergyFilters.length > 0 && !allergyFilters.some((allergy) => restaurant.tags.includes(allergy))) {
    return false;
  }

  return true;
});

const parseDeliveryTime = (deliveryTime: string) => {
  const match = deliveryTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
};

const parsePriceLevel = (priceRange: string) => {
  const matches = priceRange.match(/Rs\./g);
  return matches ? matches.length : 0;
};

const sortRestaurants = (restaurantList: RestaurantDisplay[], sortBy: string) => [...restaurantList].sort((a, b) => {
  switch (sortBy) {
    case "rating":
      return b.rating - a.rating;
    case "deliveryTime":
      return parseDeliveryTime(a.deliveryTime) - parseDeliveryTime(b.deliveryTime);
    case "priceAsc":
      return parsePriceLevel(a.priceRange) - parsePriceLevel(b.priceRange);
    default:
      return 0;
  }
});

export default function BrowseRestaurants() {
  const { user, updateUser } = useAuth();
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState("any");
  const [deliveryFilter, setDeliveryFilter] = useState("any");
  const [allergyFilters, setAllergyFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [restaurants, setRestaurants] = useState<RestaurantDisplay[]>([]);
  const [searchedRestaurants, setSearchedRestaurants] = useState<RestaurantDisplay[]>([]);
  const [foodResults, setFoodResults] = useState<FoodSearchDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");
  const [savedAllergies, setSavedAllergies] = useState<string[]>([]);
  const [fallbackCity, setFallbackCity] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const hasSearchQuery = trimmedSearchQuery.length > 0;

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const response = await getProfile();
        const profileData: BrowseProfile | undefined = response.data?.success ? response.data.data as BrowseProfile : undefined;
        if (profileData) {
          updateUser(profileData);
          setSavedAllergies(Array.isArray(profileData.allergyPreferences) ? profileData.allergyPreferences : []);
        }
        const savedCity = profileData?.address?.city || profileData?.city || "";
        setFallbackCity(savedCity);
        await detectLocationAndFetch(savedCity);
      } catch (err) {
        console.error("Error syncing profile:", err);
        await fetchRestaurants();
      }
    };

    syncProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();
      const address = data?.address || {};
      const city = address.city || address.town || address.village || address.county || "";

      return {
        city,
        label: data?.display_name || city || "Current location",
      };
    } catch (err) {
      console.error("Reverse geocode failed:", err);
      return null;
    }
  };

  const fetchRestaurants = async (options?: {
    city?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  }) => {
    try {
      setLoading(true);
      setError("");
      const response = options?.city || (typeof options?.lat === "number" && typeof options?.lng === "number")
        ? await getNearbyRestaurants({
          city: options.city,
          lat: options.lat,
          lng: options.lng,
          radiusKm: options.radiusKm || 10
        })
        : await getAllRestaurants();
      // Handle the nested API response structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const restaurantsData: Restaurant[] = responseData?.data || responseData || [];

      const formattedRestaurants: RestaurantDisplay[] = (Array.isArray(restaurantsData) ? restaurantsData : []).map(mapRestaurantToDisplay);
      setRestaurants(formattedRestaurants);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const detectLocationAndFetch = async (savedCity?: string) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      await fetchRestaurants(savedCity ? { city: savedCity } : undefined);
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const reverseLookup = await reverseGeocode(latitude, longitude);
          const city = reverseLookup?.city || savedCity;

          await fetchRestaurants({
            city,
            lat: latitude,
            lng: longitude,
            radiusKm: 10,
          });
          resolve();
        },
        async () => {
          await fetchRestaurants(savedCity ? { city: savedCity } : undefined);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    });
  };

  useEffect(() => {
    let isActive = true;

    if (!hasSearchQuery) {
      setSearchLoading(false);
      setSearchError("");
      setSearchedRestaurants([]);
      setFoodResults([]);
      return () => {
        isActive = false;
      };
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const [restaurantResponse, foodResponse] = await Promise.all([
          getAllRestaurants({ search: trimmedSearchQuery, status: "active", limit: 12 }),
          searchMenuItems(trimmedSearchQuery)
        ]);

        if (!isActive) {
          return;
        }

        if (restaurantResponse.error || foodResponse.error) {
          throw new Error(restaurantResponse.error || foodResponse.error || "Search failed");
        }

        const restaurantData = restaurantResponse.data?.data || [];
        setSearchedRestaurants((Array.isArray(restaurantData) ? restaurantData : []).map(mapRestaurantToDisplay));

        const menuItems: MenuItem[] = Array.isArray(foodResponse.data?.data) ? foodResponse.data.data : [];
        const mappedFoodResults = menuItems
          .map((item) => {
            if (!item.restaurant || typeof item.restaurant === "string") {
              return null;
            }

            return {
              _id: item._id,
              name: item.name,
              description: item.description || "",
              price: item.price,
              image: item.image || "/food-placeholder.jpg",
              restaurantId: item.restaurant._id,
              restaurantName: item.restaurant.name,
              restaurantCuisine: item.restaurant.cuisineType?.join(", ") || "Various",
              restaurantPriceRange: formatPriceRange(item.restaurant.priceRange || "Rs.Rs."),
              restaurantDeliveryTime: item.restaurant.deliveryTime
                ? `${item.restaurant.deliveryTime.min}-${item.restaurant.deliveryTime.max} min`
                : "30-45 min",
            };
          })
          .filter((item): item is FoodSearchDisplay => Boolean(item));

        setFoodResults(mappedFoodResults);
      } catch (err) {
        console.error("Error searching restaurants and food:", err);
        if (isActive) {
          setSearchedRestaurants([]);
          setFoodResults([]);
          setSearchError("Failed to search restaurants and food");
        }
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [hasSearchQuery, trimmedSearchQuery]);

  const filteredRestaurants = applyRestaurantFilters(
    restaurants,
    cuisineFilters,
    ratingFilter,
    deliveryFilter,
    allergyFilters
  );
  const sortedRestaurants = sortRestaurants(filteredRestaurants, sortBy);
  const filteredSearchedRestaurants = applyRestaurantFilters(
    searchedRestaurants,
    cuisineFilters,
    ratingFilter,
    deliveryFilter,
    allergyFilters
  );
  const sortedSearchedRestaurants = sortRestaurants(filteredSearchedRestaurants, sortBy);

  const cuisines = ["Indian", "Italian", "Japanese", "American", "Nepali", "Chinese"];
  const allergyOptions = ["Gluten-Free", "Vegetarian", "Dairy-Free", "Nut-Free"];
  const restaurantSectionTitle = hasSearchQuery ? `Search Results for "${trimmedSearchQuery}"` : "Restaurants Near You";

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>

            {/* Cuisine */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Cuisine</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              <div className="mt-4 space-y-3">
                {cuisines.map((cuisine) => (
                  <label key={cuisine} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      checked={cuisineFilters.includes(cuisine)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCuisineFilters([...cuisineFilters, cuisine]);
                        } else {
                          setCuisineFilters(cuisineFilters.filter((c) => c !== cuisine));
                        }
                      }}
                    />
                    <span className="text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Rating</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={ratingFilter === "any"}
                    onChange={() => setRatingFilter("any")}
                  />
                  <span className="text-gray-700">Any Rating</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={ratingFilter === "4+"}
                    onChange={() => setRatingFilter("4+")}
                  />
                  <span className="text-gray-700">4+ Stars</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={ratingFilter === "3+"}
                    onChange={() => setRatingFilter("3+")}
                  />
                  <span className="text-gray-700">3+ Stars</span>
                </label>
              </div>
            </div>

            {/* Delivery Time */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Delivery Time</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={deliveryFilter === "any"}
                    onChange={() => setDeliveryFilter("any")}
                  />
                  <span className="text-gray-700">Any Time</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={deliveryFilter === "30"}
                    onChange={() => setDeliveryFilter("30")}
                  />
                  <span className="text-gray-700">Less than 30 mins</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                    checked={deliveryFilter === "60"}
                    onChange={() => setDeliveryFilter("60")}
                  />
                  <span className="text-gray-700">30-60 mins</span>
                </label>
              </div>
            </div>

            {/* Allergy-Friendly */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Allergy-Friendly Options</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </button>
              <div className="mt-4 space-y-3">
                {allergyOptions.map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      checked={allergyFilters.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllergyFilters([...allergyFilters, option]);
                        } else {
                          setAllergyFilters(allergyFilters.filter((a) => a !== option));
                        }
                      }}
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{user?.loyaltyPoints?.toLocaleString() || 0} Points</span>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Today&apos;s Deals
                </button>
              </div>
            </div>

            {savedAllergies.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Saved allergy preferences:</span>
                  {savedAllergies.map((allergy) => (
                    <span key={allergy} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{restaurantSectionTitle}</h1>
                {hasSearchQuery && (
                  <p className="mt-1 text-sm text-gray-500">Showing matching restaurants and food items for your search.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Rating</option>
                  <option value="deliveryTime">Delivery Time</option>
                  <option value="priceAsc">Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Base Loading State */}
            {!hasSearchQuery && loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-gray-600">Loading restaurants...</span>
              </div>
            )}

            {/* Search Loading State */}
            {hasSearchQuery && searchLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-gray-600">Searching restaurants and food...</span>
              </div>
            )}

            {/* Base Error State */}
            {!hasSearchQuery && error && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => fetchRestaurants(fallbackCity ? { city: fallbackCity } : undefined)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Search Error State */}
            {hasSearchQuery && !searchLoading && searchError && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{searchError}</p>
              </div>
            )}

            {/* Search Results */}
            {hasSearchQuery && !searchLoading && !searchError && (
              <div className="space-y-10">
                {sortedSearchedRestaurants.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <Store className="h-5 w-5 text-red-500" />
                      <h2 className="text-xl font-bold text-gray-900">Restaurants</h2>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                        {sortedSearchedRestaurants.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedSearchedRestaurants.map((restaurant) => (
                        <Link
                          key={`search-restaurant-${restaurant._id}`}
                          href={`/view-restaurant/${restaurant._id}`}
                          className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                          <div className="relative h-40 bg-gray-200">
                            <Image
                              src={restaurant.image}
                              alt={restaurant.name}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-medium">{restaurant.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {restaurant.cuisine} • {restaurant.priceRange}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{restaurant.deliveryTime}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {foodResults.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                      <h2 className="text-xl font-bold text-gray-900">Food Items</h2>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                        {foodResults.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {foodResults.map((food) => (
                        <Link
                          key={`search-food-${food._id}`}
                          href={`/view-restaurant/${food.restaurantId}`}
                          className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
                        >
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            <Image
                              src={food.image}
                              alt={food.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">{food.name}</h3>
                                <p className="text-sm font-medium text-red-500">{food.restaurantName}</p>
                              </div>
                              <span className="whitespace-nowrap rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                                Rs. {food.price}
                              </span>
                            </div>
                            {food.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-600">{food.description}</p>
                            )}
                            <p className="mt-3 text-xs text-gray-500">
                              {food.restaurantCuisine} • {food.restaurantPriceRange} • {food.restaurantDeliveryTime}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {sortedSearchedRestaurants.length === 0 && foodResults.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No restaurants or food items found for &quot;{trimmedSearchQuery}&quot;.</p>
                  </div>
                )}
              </div>
            )}

            {/* Default Restaurant Grid */}
            {!hasSearchQuery && !loading && !error && sortedRestaurants.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No restaurants found matching your criteria.</p>
              </div>
            )}

            {!hasSearchQuery && !loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedRestaurants.map((restaurant) => (
                  <Link
                    key={restaurant._id}
                    href={`/view-restaurant/${restaurant._id}`}
                    className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-40 bg-gray-200">
                      <Image
                        src={restaurant.image}
                        alt={restaurant.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                        priority={sortedRestaurants.indexOf(restaurant) < 3}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{restaurant.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {restaurant.cuisine} • {restaurant.priceRange}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      {restaurant.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {restaurant.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors">
                        View Menu
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
