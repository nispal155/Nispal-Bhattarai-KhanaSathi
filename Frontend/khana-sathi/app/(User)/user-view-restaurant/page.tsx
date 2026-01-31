// app/restaurants/[slug]/page.tsx
import Image from "next/image";
import { Star, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

export default function RestaurantDetail() {
  const restaurant = {
    name: "KFC Itahari",
    rating: 4.9,
    reviews: "Based on 5000+ reviews",
    location: "Itahari, Kalanki",
    deliveryTime: "30 Minutes",
    items: [
      { name: "Green Broccoli", price: "NPR 150", image: "/green-broccoli.jpg", isVeg: true },
      { name: "Purple Onion", price: "NPR 190", image: "/purple-onion.jpg", isVeg: true },
      { name: "Chili Bell Pepper", price: "NPR 220", image: "/chili-pepper.jpg", isVeg: true },
      { name: "Green Cabbage", price: "NPR 150", image: "/green-cabbage.jpg", isVeg: true },
      { name: "Roasted Corn", price: "NPR 200", image: "/roasted-corn.jpg", isVeg: true },
      { name: "Organic Asparagus", price: "NPR 220", image: "/asparagus.jpg", isVeg: true },
      { name: "Purple Onion", price: "NPR 220", image: "/purple-onion-2.jpg", isVeg: true },
      { name: "Cherry Tomato", price: "NPR 330", image: "/cherry-tomato.jpg", isVeg: true },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <nav className="bg-linear-to-r from-red-600 to-orange-500 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/logo-chili.png" alt="KhanaSathi" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold">KhanaSathi</span>
            </div>

            <div className="flex items-center gap-6">
              <button className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white text-red-700 font-semibold rounded-full hover:bg-gray-100 transition">
                Profile
              </button>
              <button className="lg:hidden text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Restaurant Header */}
      <section className="relative bg-linear-to-br from-red-50 to-orange-50 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-2xl font-bold text-gray-800">{restaurant.rating}</span>
                <span className="text-gray-600 ml-2">{restaurant.reviews}</span>
              </div>
              <p className="text-xl text-gray-700 mt-2 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {restaurant.location}
              </p>
            </div>

            <div className="md:ml-auto mt-4 md:mt-0">
              <div className="bg-white px-6 py-4 rounded-full shadow-lg inline-flex items-center gap-3">
                <Clock className="w-6 h-6 text-green-600" />
                <span className="font-bold text-lg">{restaurant.deliveryTime} Delivery</span>
              </div>
            </div>
          </div>

          {/* Our Items Section */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
              <h2 className="text-4xl font-bold text-gray-900">
                OUR ITEMS
              </h2>

              <div className="flex items-center gap-6">
                <select className="px-6 py-3 bg-white border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm">
                  <option>NON-VEG</option>
                  <option>VEG</option>
                  <option>ALL</option>
                </select>

                <div className="flex items-center gap-4">
                  <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {restaurant.items.map((item, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                  <div className="relative h-64">
                    <Image
                      src={item.image || "/placeholder-food.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isVeg && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Veg
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-red-600">{item.price}</span>
                      <button className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-red-200 transition">
                        Add +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating & Review Highlight */}
          <div className="bg-linear-to-r from-red-50 to-orange-50 rounded-3xl p-8 mb-16 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="text-center md:text-left">
                <div className="text-7xl md:text-8xl font-black text-red-600">4.9</div>
                <p className="text-xl text-gray-700 mt-2">{restaurant.reviews}</p>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xl text-gray-800 italic">
                  "Botanica crackers are a staple in my pantry. They are a healthier alternative to traditional crackers and chips, but still satisfy my craving for something spicy and crunchy. Chili garlic flavor is my personal favorite - it's so delicious!"
                </p>
                <p className="text-lg text-gray-600 mt-4">
                  Jennifer - From California
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Challenge Banner */}
          <div className="relative bg-linear-to-r from-red-600 to-red-800 rounded-3xl overflow-hidden shadow-2xl mb-16">
            <div className="relative h-96 md:h-[500px]">
              <Image
                src="/scooter-delivery-challenge.jpg"
                alt="30 Minutes Delivery Challenge"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
                <h2 className="text-5xl md:text-6xl font-black mb-6">
                  Crispy, Every Bite Taste
                  <br />
                  <span className="text-yellow-300">30 Minutes Fast Delivery Challenge</span>
                </h2>

                <button className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-black text-2xl px-16 py-6 rounded-full shadow-2xl transform hover:scale-105 transition mt-8">
                  Order Now
                </button>
              </div>
            </div>
          </div>

          {/* Food Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
            {[
              "/food-penne.jpg",
              "/food-burger.jpg",
              "/food-salad.jpg",
              "/food-meatballs.jpg",
              "/food-cheeseburger.jpg",
            ].map((src, i) => (
              <div key={i} className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <Image src={src} alt="Food" fill className="object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>

          {/* Footer */}
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
                {/* Red Box */}
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

              {/* Yellow Line + Copyright */}
              <div className="mt-20 pt-10">
                <div className="h-2 bg-yellow-400 w-full mb-8"></div>

                <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-base">
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
      </section>
    </div>
  );
}