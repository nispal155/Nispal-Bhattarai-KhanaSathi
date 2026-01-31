"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Clock, Star, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function BrowseRestaurants() {
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState("any");
  const [deliveryFilter, setDeliveryFilter] = useState("any");
  const [allergyFilters, setAllergyFilters] = useState<string[]>([]);

  const restaurants = [
    {
      slug: "the-spice-route",
      image: "/restaurant-1.jpg",
      name: "The Spice Route",
      rating: 4.5,
      cuisine: "Indian",
      priceRange: "$$",
      deliveryTime: "30-45 min",
      tags: ["Healthy", "Family-Friendly"],
    },
    {
      slug: "mama-mias-pizzeria",
      image: "/restaurant-2.jpg",
      name: "Mama Mia's Pizzeria",
      rating: 4.8,
      cuisine: "Italian",
      priceRange: "$$",
      deliveryTime: "20-30 min",
      tags: ["Family-Friendly"],
    },
    {
      slug: "sushi-central",
      image: "/restaurant-3.jpg",
      name: "Sushi Central",
      rating: 4.2,
      cuisine: "Japanese",
      priceRange: "$$$",
      deliveryTime: "35-50 min",
      tags: ["Healthy"],
    },
    {
      slug: "burger-haven",
      image: "/restaurant-4.jpg",
      name: "Burger Haven",
      rating: 4.3,
      cuisine: "American",
      priceRange: "$",
      deliveryTime: "25-40 min",
      tags: [],
    },
    {
      slug: "nepali-kitchen",
      image: "/restaurant-5.jpg",
      name: "Nepali Kitchen",
      rating: 4.7,
      cuisine: "Nepali",
      priceRange: "$$",
      deliveryTime: "40-55 min",
      tags: ["Vegetarian-Friendly"],
    },
    {
      slug: "healthy-bowl-co",
      image: "/restaurant-6.jpg",
      name: "Healthy Bowl Co.",
      rating: 4.6,
      cuisine: "Healthy",
      priceRange: "$$",
      deliveryTime: "20-35 min",
      tags: ["Healthy", "Vegan Options"],
    },
  ];

  const cuisines = ["Indian", "Italian", "Japanese", "American", "Nepali", "Chinese"];
  const allergyOptions = ["Gluten-Free", "Vegetarian", "Dairy-Free", "Nut-Free"];

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
                <span className="block text-xs text-red-400">Admin</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>👤</span> Profile
              </Link>
              <Link href="/support" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>💬</span> Support
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 overflow-hidden">
              <Image src="/avatar.jpg" alt="Profile" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </div>
      </nav>

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
            {/* Search & Points */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for restaurants or dishes..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">1,250 Points</span>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Today&apos;s Deals
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Restaurants Near You</h1>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Sort by:</span>
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option>Recommended</option>
                  <option>Rating</option>
                  <option>Delivery Time</option>
                  <option>Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.slug}
                  href={`/view-restaurant/${restaurant.slug}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 bg-gray-200">
                    <Image
                      src={restaurant.image}
                      alt={restaurant.name}
                      fill
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
                      View Restaurants
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-red-500 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <p>© 2025 KhanaSathi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
