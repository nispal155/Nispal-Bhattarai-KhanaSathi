'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Search, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNearbyRestaurants, type Restaurant } from '@/lib/restaurantService';
import { formatPriceRange } from '@/lib/formatters';

export default function NearestRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch nearby restaurants (with optional city filter)
        const options = selectedCity ? { city: selectedCity } : {};
        const response = await getNearbyRestaurants(options);
        
        const restaurantsData = response.data?.data || [];
        setRestaurants(restaurantsData);
        
        // Extract unique cities for filter dropdown
        const uniqueCities = Array.from(
          new Set(restaurantsData.map((r: Restaurant) => r.address?.city).filter(Boolean))
        ) as string[];
        setCities(uniqueCities.sort());
      } catch (err) {
        console.error('Failed to load nearby restaurants:', err);
        setError('Unable to load restaurants. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [selectedCity]);

  function renderStars() {
    return (
      <div className="flex items-center gap-1 text-[#ffbe0b]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff5f0] to-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-8 w-8 text-[#d62828]" />
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">Nearest Restaurants</h1>
              <p className="text-[#6b7280]">Find restaurants near you</p>
            </div>
          </div>

          {/* City Filter */}
          {cities.length > 0 && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-[#374151]">Filter by City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-[#374151] transition hover:border-[#d62828] focus:border-[#d62828] focus:outline-none"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="h-12 w-12 animate-spin text-[#d62828]" />
            <p className="mt-4 text-[#6b7280]">Loading restaurants...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && restaurants.length === 0 && !error && (
          <div className="rounded-lg bg-[#fff4ea] p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-[#d62828]" />
            <p className="mt-4 text-lg text-[#6b7280]">
              {selectedCity
                ? `No restaurants found in ${selectedCity}`
                : 'No restaurants available at the moment'}
            </p>
          </div>
        )}

        {/* Restaurants Grid */}
        {!isLoading && restaurants.length > 0 && (
          <div>
            <p className="mb-8 text-[#6b7280]">
              Found <span className="font-bold text-[#111827]">{restaurants.length}</span> restaurants
              {selectedCity && ` in ${selectedCity}`}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restaurants.map((restaurant) => {
                const cuisines = restaurant.cuisineType?.join(', ') || 'Chef specials';
                const city = restaurant.address?.city || 'KhanaSathi';
                const deliveryTime = restaurant.deliveryTime
                  ? `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min`
                  : '30-45 min';

                return (
                  <Link
                    key={restaurant._id}
                    href={`/view-restaurant/${restaurant._id}`}
                    className="group overflow-hidden rounded-[26px] bg-white shadow-[0_25px_60px_rgba(16,24,40,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)]"
                  >
                    <div className="relative h-48 overflow-hidden bg-[#fff3f0]">
                      <Image
                        src={restaurant.logoUrl || '/burger.png'}
                        alt={restaurant.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute right-3 top-3 rounded-full bg-[#e63946] px-3 py-1 text-xs font-bold text-white">
                        {city}
                      </div>
                    </div>
                    <div className="space-y-2 p-4">
                      {renderStars()}
                      <h3 className="font-bold text-[#111827] line-clamp-1">{restaurant.name}</h3>
                      <p className="line-clamp-2 text-sm text-[#6b7280]">{cuisines}</p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#e63946]">
                          {formatPriceRange(restaurant.priceRange || 'Rs.')}
                        </span>
                        <span className="rounded-full bg-[#fff4c2] px-2 py-1 font-semibold text-[#815500]">
                          {deliveryTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
