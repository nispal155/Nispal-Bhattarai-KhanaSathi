"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Star, Search, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/browse-restaurants?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/browse-restaurants');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-red-600 to-orange-500 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image src="/logo-chili.png" alt="KhanaSathi" fill className="object-contain" />
              </div>
              <span className="text-2xl md:text-3xl font-bold">KhanaSathi</span>
            </Link>

            {/* Right side - Login/Signup + mobile menu icon */}
            <div className="flex items-center gap-6">
              {user ? (
                <div className="hidden md:flex items-center gap-4">
                  <Link href="/user-profile" className="font-semibold hover:text-yellow-200">
                    Hi, {user.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="px-6 py-2 bg-white text-red-700 font-semibold rounded-full hover:bg-gray-100 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-red-700 font-semibold rounded-full hover:bg-gray-100 transition"
                >
                  Login / Signup
                </Link>
              )}

              <button
                className="lg:hidden text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-red-600 p-4 absolute w-full shadow-xl">
            <div className="flex flex-col gap-4">
              <Link href="/browse-restaurants" className="text-white font-semibold">Browse Restaurants</Link>
              {user ? (
                <>
                  <Link href="/user-profile" className="text-white font-semibold">Profile</Link>
                  <button onClick={logout} className="text-left text-white font-semibold">Logout</button>
                </>
              ) : (
                <Link href="/login" className="text-white font-semibold">Login / Signup</Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pt-20 pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Best Food for
              <br />
              <span className="text-red-600">Best Restaurants</span>
            </h1>



            {/* Search bar */}
            <div className="relative max-w-5xl mx-auto">
              <div className="relative z-20 max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search for restaurants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-8 py-6 bg-white border-2 border-gray-300 rounded-full text-gray-700 text-lg focus:outline-none focus:border-red-500 shadow-xl"
                    />
                    <Search className="absolute right-8 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-2xl transition transform hover:scale-105"
                  >
                    Explore menu
                  </button>
                </div>
              </div>

              {/* Floating food images - positioned to match screenshot */}
              <div className="absolute inset-0 pointer-events-none hidden lg:block">
                <div className="absolute top-0 left-0 w-72 transform -rotate-6 translate-x-12 translate-y-16 shadow-2xl">
                  <Image src="/food-pasta-hero.jpg" alt="" width={600} height={600} className="rounded-3xl object-cover" />
                </div>

                <div className="absolute top-20 right-0 w-80 transform rotate-6 -translate-x-16 shadow-2xl">
                  <Image src="/food-meat-hero.jpg" alt="" width={700} height={700} className="rounded-3xl object-cover" />
                </div>

                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 transform shadow-2xl">
                  <Image src="/food-bowl-hero.jpg" alt="" width={800} height={800} className="rounded-3xl object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative leaves/mushrooms */}
        <div className="absolute bottom-0 left-0 w-80 h-80 opacity-40 pointer-events-none">
          <Image src="/mushroom-cluster.png" alt="" fill className="object-contain" />
        </div>
        <div className="absolute top-0 right-20 w-64 h-64 opacity-30 pointer-events-none">
          <Image src="/leaf-cluster.png" alt="" fill className="object-contain" />
        </div>
      </section>

      {/* How We Work Section */}
      <section className="relative bg-gradient-to-b from-white via-red-50 to-red-100 py-32 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-96 bg-red-600 rounded-t-[10rem] transform translate-y-1/2 opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl font-black text-center mb-20">
            EASY ORDER IN 3 STEPS
          </h2>

          <div className="grid md:grid-cols-3 gap-16 relative z-10">
            {[
              { step: 1, title: "Explore Menu", icon: "🍽️" },
              { step: 2, title: "Choose Dish", icon: "🔔" },
              { step: 3, title: "Place Order", icon: "🚚" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-32 h-32 mx-auto mb-8 bg-yellow-400 rounded-full flex items-center justify-center text-6xl font-black shadow-2xl transform hover:scale-110 transition">
                  {item.icon}
                </div>
                <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600 text-lg max-w-xs mx-auto">
                  A range of powerful tools for viewing, querying and filtering your data.
                </p>
              </div>
            ))}
          </div>

          {/* Watch & Follow circle */}
          <div className="mt-20 flex justify-center">
            <div className="relative w-80 h-80 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-full opacity-20 animate-pulse" />
              <div className="absolute inset-8 bg-white rounded-full shadow-2xl overflow-hidden border-8 border-yellow-400">
                <Image src="/team-working.jpg" alt="Team" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Offer For You */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-black text-center mb-16">
            Best Offer For You
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "PASTA", price: "NPR 280", discount: "22%", rating: "★★★★★", image: "/pasta-offer.jpg" },
              { title: "BBQ Chicken & Pork", price: "NPR 1500", discount: "25%", rating: "★★★★★", image: "/bbq-offer.jpg" },
              { title: "Nuggets Recipe", price: "NPR 1800", discount: "30%", rating: "★★★★★", image: "/nuggets-offer.jpg" },
              { title: "Burgers", price: "NPR 2000", discount: "15%", rating: "★★★★★", image: "/burger-offer.jpg" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition group">
                <div className="relative h-64">
                  <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    {item.discount} OFF
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className="text-yellow-500 font-bold">{item.rating}</span>
                  </div>
                  <p className="text-red-600 font-bold text-xl">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 30 Minutes Fast Delivery Challenge */}
      <section className="py-32 bg-gradient-to-r from-red-600 to-red-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black leading-tight mb-12">
            Crispy, Every Bite Taste
            <br />
            <span className="text-yellow-300">30 Minutes Fast Delivery Challenge</span>
          </h2>

          <div className="relative max-w-6xl mx-auto h-[500px] md:h-[700px] mb-16">
            <div className="absolute inset-0 bg-black/30 rounded-3xl" />
            <div className="absolute inset-12 bg-white rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/scooter-challenge-hero.jpg"
                alt="Delivery Challenge"
                fill
                className="object-cover"
              />
            </div>

            <button className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-yellow-400 hover:bg-yellow-300 text-red-900 font-black text-3xl px-16 py-8 rounded-full shadow-2xl transform hover:scale-105 transition">
              Order Now
            </button>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-20 -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-10 translate-x-1/3 -translate-y-1/3" />
      </section>

      {/* Footer - exact match to your screenshot */}

    </div>
  );
}