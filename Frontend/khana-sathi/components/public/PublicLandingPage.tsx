"use client";

import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { ArrowRight, ChevronDown, MapPin, Menu, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAllRestaurants, type Restaurant } from "@/lib/restaurantService";
import { formatPriceRange } from "@/lib/formatters";

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const navLinks = [
  { label: "Restaurants", href: "/nearest-restaurants" },
  { label: "Best Offers", href: "/browse-offers" },
  { label: "Fast Delivery", href: "/fast-delivery" },
];

const orderSteps = [
  {
    step: 1,
    title: "Explore Menu",
    description: "Browse the restaurants already added to KhanaSathi and pick the one that fits your craving.",
  },
  {
    step: 2,
    title: "Choose Dish",
    description: "Open the menu, compare delivery times, and choose dishes that match your taste and budget.",
  },
  {
    step: 3,
    title: "Place Order",
    description: "Checkout in a few taps and let our platform handle the rest from kitchen to doorstep.",
  },
];

const heroShowcaseImages = [
  {
    title: "Hero platter",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    className:
      "absolute left-0 top-8 w-48 -rotate-12 rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.18)] lg:w-60",
  },
  {
    title: "Signature bowl",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
    className:
      "absolute right-2 top-24 w-56 rotate-[10deg] rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.18)] lg:w-72",
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
];

const getDashboardPath = (role?: string) => {
  switch (role) {
    case "admin":
      return "/admin-dashboard";
    case "restaurant":
      return "/RM-Dashboard";
    case "delivery_staff":
      return "/rider-dashboard";
    default:
      return "/browse-restaurants";
  }
};

function renderStars() {
  return (
    <div className="flex items-center gap-1 text-[#ffbe0b]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function RestaurantOfferCard({ restaurant }: { restaurant: Restaurant }) {
  const cuisines = restaurant.cuisineType?.join(", ") || "Chef specials";
  const city = restaurant.address?.city || "KhanaSathi";
  const deliveryTime = restaurant.deliveryTime
    ? `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min`
    : "30-45 min";

  return (
    <Link
      href={`/view-restaurant/${restaurant._id}`}
      className="group overflow-hidden rounded-[26px] bg-white shadow-[0_25px_60px_rgba(16,24,40,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(16,24,40,0.18)]"
    >
      <div className="relative h-64 overflow-hidden bg-[#fff3f0]">
        <Image
          src={restaurant.logoUrl || "/burger.png"}
          alt={restaurant.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-4 top-4 rounded-full bg-[#e63946] px-4 py-1 text-sm font-bold text-white">
          {city}
        </div>
      </div>
      <div className="space-y-3 p-6">
        {renderStars()}
        <div>
          <h3 className="text-xl font-bold text-[#111827]">{restaurant.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-[#6b7280]">{cuisines}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-bold text-[#e63946]">{formatPriceRange(restaurant.priceRange || "Rs.")}</span>
          <span className="rounded-full bg-[#fff4c2] px-3 py-1 font-semibold text-[#815500]">{deliveryTime}</span>
        </div>
      </div>
    </Link>
  );
}

export default function PublicLandingPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  const profileHref = getDashboardPath(user?.role);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoadingRestaurants(true);
        const response = await getAllRestaurants({ limit: 8 });
        const payload = response.data?.data || [];
        const liveRestaurants = Array.isArray(payload) ? payload : [];
        setRestaurants(liveRestaurants);
        if (liveRestaurants[0]?._id) {
          setSelectedRestaurantId((current) => current || liveRestaurants[0]._id);
        }
      } catch (error) {
        console.error("Failed to load restaurants for landing page:", error);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    void loadRestaurants();
  }, []);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant._id === selectedRestaurantId) || restaurants[0] || null,
    [restaurants, selectedRestaurantId]
  );

  const featuredRestaurants = restaurants.slice(0, 4);
  const footerRestaurants = restaurants.slice(0, 3);

  const exploreHref = selectedRestaurant?._id
    ? `/view-restaurant/${selectedRestaurant._id}`
    : "/browse-restaurants";

  const selectedCuisineText = selectedRestaurant?.cuisineType?.join(", ") || "Fresh dishes and local favorites";
  const selectedLocation = selectedRestaurant?.address?.city || "KhanaSathi";
  const selectedDelivery = selectedRestaurant?.deliveryTime
    ? `${selectedRestaurant.deliveryTime.min}-${selectedRestaurant.deliveryTime.max} min`
    : "30-45 min";

  return (
    <div className={`${bodyFont.className} min-h-screen overflow-hidden bg-white text-[#111827]`}>
      <nav className="sticky top-0 z-50 border-b border-[#f0e8df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_rgba(238,95,74,0.18)]">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain p-2" />
            </div>
            <div>
              <span className={`${headingFont.className} block text-2xl font-extrabold text-[#d62828]`}>
                KhanaSathi
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-[#8f8a82]">Food delivered with flair</span>
            </div>
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-base font-semibold text-[#23212b] transition hover:text-[#d62828]">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={profileHref}
                  className="hidden rounded-full bg-gradient-to-r from-[#ffcf40] to-[#ffc53a] px-6 py-3 text-sm font-bold text-[#2b2112] shadow-[0_16px_35px_rgba(255,207,64,0.35)] transition hover:brightness-105 md:inline-flex"
                >
                  Continue
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden rounded-full border border-[#eadfd7] px-5 py-3 text-sm font-semibold text-[#4e4a44] transition hover:border-[#d62828] hover:text-[#d62828] md:inline-flex"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full bg-gradient-to-r from-[#ffcf40] to-[#ffc53a] px-6 py-3 text-sm font-bold text-[#2b2112] shadow-[0_16px_35px_rgba(255,207,64,0.35)] transition hover:brightness-105 md:inline-flex"
              >
                Login / Signup
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ece2d8] text-[#23212b] lg:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-[#f0e8df] px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} className="font-semibold text-[#23212b]">
                  {link.label}
                </Link>
              ))}
              {user ? (
                <Link href={profileHref} onClick={() => setIsMenuOpen(false)} className="font-semibold text-[#23212b]">
                  Continue
                </Link>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="font-semibold text-[#23212b]">
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fff7f2_0%,#fffaf5_40%,#fff3dd_100%)] pb-24 pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-[#ffd166]/25 blur-3xl" />
            <div className="absolute right-[-6rem] top-10 h-56 w-56 rounded-full bg-[#ff6b6b]/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ffbe0b]/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="mx-auto max-w-4xl text-center lg:mx-0 lg:text-left">
                <div className="inline-flex items-center rounded-full border border-[#ffd7a3] bg-white px-5 py-2 text-sm font-bold uppercase tracking-[0.24em] text-[#b56107] shadow-[0_12px_28px_rgba(255,191,105,0.18)]">
                  Arriving with flavor every day
                </div>

                <h1 className={`${headingFont.className} mt-8 text-5xl font-extrabold leading-[0.92] text-[#151515] md:text-6xl lg:text-7xl`}>
                  Best Food for
                  <br />
                  <span className="mt-3 inline-block rounded-[28px] bg-[#ffd43b] px-5 py-2 text-[#d62828]">
                    Best Restaurants
                  </span>
                </h1>

                <p className="mt-8 text-lg text-[#5f5b55] md:text-xl">
                  Live restaurant data from your project, polished into the bold landing page style you shared.
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={selectedRestaurantId}
                      onChange={(event) => setSelectedRestaurantId(event.target.value)}
                      className="w-full appearance-none rounded-full border-2 border-[#eadfd7] bg-white px-8 py-6 pr-16 text-lg font-semibold text-[#36312e] shadow-[0_18px_40px_rgba(0,0,0,0.08)] outline-none transition focus:border-[#d62828]"
                    >
                      {isLoadingRestaurants && <option value="">Loading restaurants...</option>}
                      {!isLoadingRestaurants && restaurants.length === 0 && <option value="">Our Restaurants</option>}
                      {restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                          {restaurant.address?.city ? ` - ${restaurant.address.city}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-7 w-7 -translate-y-1/2 text-[#7d766e]" />
                  </div>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push("/login");
                      } else {
                        router.push(exploreHref);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-[#d62828] px-12 py-6 text-lg font-bold text-white shadow-[0_22px_45px_rgba(214,40,40,0.35)] transition hover:scale-[1.02] hover:bg-[#bb1f1f]"
                  >
                    Explore menu
                  </button>
                </div>

                {selectedRestaurant && (
                  <div className="mt-8 rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#fff4ea]">
                          <Image
                            src={selectedRestaurant.logoUrl || "/burger.png"}
                            alt={selectedRestaurant.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[#121212]">{selectedRestaurant.name}</p>
                          <p className="mt-1 text-sm text-[#6b675f]">{selectedCuisineText}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <span className="inline-flex items-center rounded-full bg-[#fff4c2] px-4 py-2 text-sm font-semibold text-[#7a5d00]">
                          <MapPin className="mr-2 h-4 w-4" />
                          {selectedLocation}
                        </span>
                        <span className="rounded-full bg-[#ffe8e8] px-4 py-2 text-sm font-semibold text-[#bf1d1d]">
                          {selectedDelivery}
                        </span>
                        <span className="rounded-full bg-[#eef8ea] px-4 py-2 text-sm font-semibold text-[#347a2a]">
                          {formatPriceRange(selectedRestaurant.priceRange || "Rs.")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative h-64 sm:h-80 md:h-96 lg:h-[560px]">
                {/* Mobile View - Featured Restaurant Card */}
                <div className="lg:hidden absolute inset-0 flex items-center justify-center">
                  <div className="w-48 sm:w-56 md:w-64 overflow-hidden rounded-[36px] bg-white shadow-[0_35px_80px_rgba(0,0,0,0.18)]">
                    <div className="relative h-48 sm:h-56 bg-[#fff2ef]">
                      <Image
                        src={selectedRestaurant?.logoUrl || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80"}
                        alt={selectedRestaurant?.name || "Featured restaurant"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-3 p-4">
                      <h4 className="font-bold text-[#111827]">{selectedRestaurant?.name}</h4>
                      <p className="line-clamp-1 text-sm text-[#6b7280]">
                        {selectedRestaurant?.cuisineType?.join(", ") || "Chef specials"}
                      </p>
                      <p className="text-xs text-[#d62828] font-semibold">
                        {selectedRestaurant?.deliveryTime ? `${selectedRestaurant.deliveryTime.min}-${selectedRestaurant.deliveryTime.max} min` : "30-45 min"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop View - Hero Showcase Images */}
                <div className="hidden lg:block relative h-[560px]">
                  {heroShowcaseImages.map((item) => (
                    <div key={item.title} className={item.className}>
                      <Image src={item.image} alt={item.title} width={520} height={520} className="h-auto w-full object-cover" />
                    </div>
                  ))}

                  <div className="absolute bottom-6 left-1/2 w-[22rem] -translate-x-1/2 overflow-hidden rounded-[36px] bg-white shadow-[0_35px_80px_rgba(0,0,0,0.18)]">
                    <div className="relative h-72 bg-[#fff2ef]">
                      <Image
                        src={selectedRestaurant?.logoUrl || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80"}
                        alt={selectedRestaurant?.name || "Featured restaurant"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-3 p-6">
                      {renderStars()}
                      <div>
                        <p className="text-2xl font-bold text-[#121212]">
                          {selectedRestaurant?.name || "KhanaSathi Favorites"}
                        </p>
                        <p className="mt-2 text-sm text-[#6c675f]">
                          {selectedRestaurant?.address?.addressLine1 || "Curated restaurant picks from your live project data."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-[#d62828]">
                          {formatPriceRange(selectedRestaurant?.priceRange || "Rs.")}
                        </span>
                        <span className="rounded-full bg-[#fff4c2] px-3 py-1 font-semibold text-[#7a5d00]">
                          {selectedDelivery}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className={`${headingFont.className} text-center text-5xl font-extrabold text-[#111111]`}>
              EASY ORDER IN 3 STEPS
            </h2>

            <div className="mt-20 grid gap-12 md:grid-cols-3">
              {orderSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#ffd43b] text-6xl font-black text-[#151515] shadow-[0_20px_45px_rgba(255,212,59,0.35)]">
                    {item.step}
                  </div>
                  <h3 className="text-3xl font-bold text-[#171717]">{item.title}</h3>
                  <p className="mx-auto mt-4 max-w-sm text-lg text-[#66615c]">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 flex justify-center">
              <div className="relative h-80 w-80">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ffd43b] via-[#ff8f5a] to-[#d62828] opacity-20" />
                <div className="absolute inset-8 overflow-hidden rounded-full border-[10px] border-[#ffd43b] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.12)]">
                  <Image
                    src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80"
                    alt="Team working"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_100%)] py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className={`${headingFont.className} text-center text-5xl font-extrabold text-[#111111]`}>
              Best Offer For You
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-[#6a645f]">
              Showing the restaurants already added in your project instead of static demo cards.
            </p>

            {featuredRestaurants.length > 0 ? (
              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {featuredRestaurants.map((restaurant) => (
                  <RestaurantOfferCard key={restaurant._id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <div className="mt-16 rounded-[32px] border border-dashed border-[#e5dacf] bg-white p-10 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
                <p className="text-lg font-semibold text-[#2b2a28]">No restaurants have been added yet.</p>
                <p className="mt-3 text-[#6f6a64]">Once restaurants are created in the project, they will appear here automatically.</p>
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#d62828] py-28 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,209,102,0.18),transparent_35%)]" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="text-center lg:text-left">
                <p className="text-lg font-medium text-[#ffe082]">Crispy, Every Bite Taste</p>
                <h2 className={`${headingFont.className} mt-6 text-5xl font-extrabold leading-tight md:text-6xl`}>
                  30 Minutes Fast
                  <br />
                  Delivery Challenge
                </h2>
                <Link
                  href={selectedRestaurant ? `/view-restaurant/${selectedRestaurant._id}` : "/browse-restaurants"}
                  className="mt-12 inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-xl font-bold text-[#d62828] shadow-[0_24px_50px_rgba(0,0,0,0.2)] transition hover:bg-[#ffd43b] hover:text-[#8b1e1e]"
                >
                  Order Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="relative flex justify-center">
                <div className="absolute inset-8 rounded-[36px] bg-white/10 blur-2xl" />
                <div className="relative h-[420px] w-full max-w-[560px] overflow-hidden rounded-[36px] border border-white/20 bg-white/10 shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
                  <Image src="/Character.svg" alt="Fast delivery" fill className="object-contain p-6" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-0 pt-0">
          <div className="grid gap-0 md:grid-cols-5">
            {galleryImages.map((image, index) => (
              <div key={image} className="relative h-[190px] overflow-hidden md:h-[260px]">
                <Image
                  src={image}
                  alt={`Food showcase ${index + 1}`}
                  fill
                  className="object-cover transition duration-700 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#111827] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <h3 className="flex items-center gap-3 text-2xl font-bold">
              <Image src="/logo.png" alt="KhanaSathi" width={40} height={40} />
              KhanaSathi
            </h3>
            <p className="mt-6 text-[#9ca3af]">
              Tuesday - Saturday: 12:00pm - 11:00pm
              <br />
              Closed on Sunday
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold">About</h4>
            <ul className="mt-6 space-y-3 text-[#9ca3af]">
              <li>Contact</li>
              <li>Fast Delivery</li>
              <li>Desserts</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold">Top Restaurants</h4>
            <ul className="mt-6 space-y-3 text-[#9ca3af]">
              {footerRestaurants.length > 0 ? (
                footerRestaurants.map((restaurant) => <li key={restaurant._id}>{restaurant.name}</li>)
              ) : (
                <>
                  <li>Restaurants will appear here</li>
                  <li>Once added to the project</li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-bold">Newsletter</h4>
            <p className="mt-6 text-[#9ca3af]">Get recent news and updates.</p>
            <div className="mt-4 flex">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 rounded-l-xl border border-[#374151] bg-[#1f2937] px-5 py-4 text-white outline-none placeholder:text-[#9ca3af] focus:border-[#d62828]"
              />
              <button className="rounded-r-xl bg-[#d62828] px-8 py-4 font-medium transition hover:bg-[#bb1f1f]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl border-t border-[#1f2937] px-6 pt-8 text-center text-sm text-[#6b7280] lg:px-8">
          © 2025 KhanaSathi. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
