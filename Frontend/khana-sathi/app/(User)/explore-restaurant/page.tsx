
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock, Star } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <UserHeader />

      {/* Hero Section - Our Restaurants */}
      <section className="relative bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
              Our <span className="text-red-600">Restaurants</span>
            </h2>
            <p className="text-xl text-gray-700 mb-10">
              Organic Food • KFC Itahari • Zinger Burgers • Grill Food • Bar B Q
            </p>
          </div>

          {/* Restaurant Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "KFC Itahari", dishes: "12 Dishes in Menu", location: "Itahari, Kalanki", image: "/kfc-itahari.jpg" },
              { name: "Zinger Burgers", dishes: "04 Dishes in Menu", image: "/zinger-burgers.jpg" },
              { name: "Grill Food", dishes: "12 Dishes in Menu", image: "/grill-food.jpg" },
              { name: "Bar B Q", dishes: "12 Dishes in Menu", image: "/bar-bq.jpg" },
              { name: "Organic Food", dishes: "12 Dishes in Menu", image: "/organic-food.jpg" },
              { name: "Zinger Burgers", dishes: "04 Dishes in Menu", image: "/zinger-burgers-2.jpg" },
              { name: "Grill Food", dishes: "12 Dishes in Menu", image: "/grill-food-2.jpg" },
              { name: "Bar B Q", dishes: "12 Dishes in Menu", image: "/bar-bq-2.jpg" },
            ].map((restaurant, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition group">
                <div className="relative h-64">
                  <Image
                    src={restaurant.image || "/placeholder-restaurant.jpg"}
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
                  {restaurant.location && (
                    <p className="text-sm text-gray-600 mb-2">{restaurant.location}</p>
                  )}
                  <p className="text-red-600 font-medium">{restaurant.dishes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 30 Minutes Delivery Challenge Banner */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-800 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="relative max-w-5xl mx-auto h-96 md:h-[500px] mb-12">
            <div className="absolute inset-0 bg-black/30 rounded-3xl" />
            <div className="absolute inset-10 bg-white rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/scooter-delivery-challenge.jpg"
                alt="30 Minutes Delivery Challenge"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-10">
              <button className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-black text-2xl px-16 py-8 rounded-full shadow-2xl transform hover:scale-105 transition">
                Order Now
              </button>
            </div>
          </div>

          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Crispy, Every Bite Taste
          </h2>
          <p className="text-3xl md:text-4xl font-bold text-yellow-300">
            30 Minutes Fast Delivery Challenge
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-20 -translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-10 translate-x-1/3 -translate-y-1/3" />
      </section>

      {/* Flash Sale Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-black text-center mb-4 text-red-600">
            Flash Sale
          </h2>
          <p className="text-2xl text-center text-gray-700 mb-16">
            Hurry Up! Limited Time Offer
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Rogan Josh", price: "NPR 1300", discount: "13%", timeLeft: "04 Days 56 Hrs 28 Mins", image: "/rogan-josh.jpg" },
              { name: "BBQ Chicken & Pork", price: "NPR 1500", discount: "25%", timeLeft: "02 Days 04 Hrs 56 Mins", image: "/bbq-chicken-pork.jpg" },
              { name: "Paneer Tikka", price: "NPR 1150", discount: "12%", timeLeft: "06 Days 04 Hrs 28 Mins", image: "/paneer-tikka.jpg" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition group">
                <div className="relative h-80">
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    {item.discount} OFF
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{item.name}</h3>
                  <p className="text-red-600 font-bold text-2xl mb-3">{item.price}</p>
                  <div className="text-sm text-gray-600">
                    Time Left: <span className="font-medium text-red-600">{item.timeLeft}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - exact match to your latest screenshot */}
      <footer className="relative bg-white pt-16 pb-12 overflow-hidden border-t border-gray-200">
        {/* Background doodles */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -bottom-20 left-0 w-96 h-96">
            <Image src="/doodle-pizza-slice.png" alt="" fill className="object-contain" />
          </div>
          <div className="absolute top-10 right-10 w-80 h-80">
            <Image src="/doodle-mushroom.png" alt="" fill className="object-contain" />
          </div>
          <div className="absolute bottom-32 right-40 w-64 h-64">
            <Image src="/doodle-leaves.png" alt="" fill className="object-contain" />
          </div>
          <div className="absolute top-40 left-32 w-72 h-72">
            <Image src="/doodle-burger.png" alt="" fill className="object-contain" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Red Box - KhanaSathi Info */}
            <div className="md:col-span-1">
              <div className="bg-red-600 text-white rounded-3xl p-10 shadow-2xl max-w-md mx-auto md:mx-0">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16">
                    <Image src="/logo-bowl-noodles.png" alt="KhanaSathi" fill className="object-contain" />
                  </div>
                  <h3 className="text-3xl font-bold">KhanaSathi</h3>
                </div>

                <p className="text-lg mb-3">
                  Tuesday – Saturday: 12:00pm – 23:00pm
                </p>
                <p className="text-lg font-semibold mb-4">
                  Closed on Sunday
                </p>

                <div className="flex items-center gap-2 text-yellow-300 text-lg">
                  <Star className="w-6 h-6 fill-current" />
                  <span>5 star rated on TripAdvisor</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-4 border-yellow-400 inline-block">
                About
              </h4>
              <ul className="space-y-3 text-gray-700 text-lg">
                <li className="hover:text-red-600 transition cursor-pointer">Fredoka One</li>
                <li className="hover:text-red-600 transition cursor-pointer">Steaks</li>
                <li className="hover:text-red-600 transition cursor-pointer">Special Dish</li>
                <li className="hover:text-red-600 transition cursor-pointer">Reservation</li>
                <li className="hover:text-red-600 transition cursor-pointer">Contact</li>
              </ul>
            </div>

            {/* Menu */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-4 border-yellow-400 inline-block">
                Menu
              </h4>
              <ul className="space-y-3 text-gray-700 text-lg">
                <li className="hover:text-red-600 transition cursor-pointer">Steaks</li>
                <li className="hover:text-red-600 transition cursor-pointer">Special Dish</li>
                <li className="hover:text-red-600 transition cursor-pointer">Burgers</li>
                <li className="hover:text-red-600 transition cursor-pointer">Cocails</li>
                <li className="hover:text-red-600 transition cursor-pointer">Bar B Q</li>
                <li className="hover:text-red-600 transition cursor-pointer">Desserts</li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-4 border-yellow-400 inline-block">
                Newsletter
              </h4>
              <p className="text-gray-600 mb-5 text-lg">
                Get recent news and updates.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="flex-1 px-6 py-4 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:border-red-500 text-gray-700 text-lg"
                />
                <button className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Yellow Line + Copyright + Social Links */}
          <div className="mt-20 pt-10">
            <div className="h-2 bg-yellow-400 w-full mb-8"></div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-gray-600 text-base">
              <p>
                © 2025 TesteNest | All shawonetc3 Themes
              </p>

              <div className="flex gap-10 mt-6 md:mt-0">
                <a href="#" className="hover:text-red-600 transition font-medium">Facebook</a>
                <a href="#" className="hover:text-red-600 transition font-medium">Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}