"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const heroImages = [
  {
    title: "Woodfire roast",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    className:
      "absolute left-2 top-10 h-[250px] w-[150px] rounded-[90px] shadow-[0_28px_60px_rgba(23,25,35,0.22)] md:left-8 md:h-[310px] md:w-[190px]",
  },
  {
    title: "Chef's skillet",
    image:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    className:
      "absolute right-4 top-28 h-[230px] w-[150px] rounded-[80px] shadow-[0_28px_60px_rgba(23,25,35,0.22)] md:right-10 md:top-24 md:h-[300px] md:w-[200px]",
  },
];

const leftOffers = [
  {
    name: "Pasta",
    price: "Rs. 280",
    oldPrice: "Rs. 360",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    tag: "-22%",
  },
  {
    name: "Butter Chicken",
    price: "Rs. 480",
    oldPrice: "Rs. 560",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
    tag: "-18%",
  },
  {
    name: "Biryani",
    price: "Rs. 330",
    oldPrice: "Rs. 410",
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=80",
    tag: "-12%",
  },
];

const rightOffers = [
  {
    name: "Nuggets Recipe",
    price: "Rs. 350",
    oldPrice: "Rs. 430",
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
    tag: "-16%",
  },
  {
    name: "Burgers",
    price: "Rs. 420",
    oldPrice: "Rs. 520",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    tag: "-20%",
  },
  {
    name: "Seekh Kebab",
    price: "Rs. 530",
    oldPrice: "Rs. 620",
    image:
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=80",
    tag: "-14%",
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

const renderStars = () => (
  <div className="flex items-center gap-0.5 text-[#f5b301]">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} className="h-3 w-3 fill-current" />
    ))}
  </div>
);

function CompactOfferCard({
  name,
  price,
  oldPrice,
  image,
  tag,
}: {
  name: string;
  price: string;
  oldPrice: string;
  image: string;
  tag: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-black/6 bg-white p-3 shadow-[0_18px_36px_rgba(19,23,35,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(19,23,35,0.13)]">
      <div className="flex items-center gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px]">
          <Image src={image} alt={name} fill className="object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute left-2 top-2 rounded-full bg-[#ffd84d] px-2 py-0.5 text-[10px] font-bold text-[#3d2800]">
            {tag}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2">{renderStars()}</div>
          <p className="truncate text-sm font-semibold text-[#1d1c20]">{name}</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="font-bold text-[#ff3157]">{price}</span>
            <span className="text-xs text-[#b0acb2] line-through">{oldPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicLandingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [spotlight, setSpotlight] = useState("restaurants");
  const [searchText, setSearchText] = useState("");

  const profileHref = getDashboardPath(user?.role);

  const handleExplore = () => {
    if (spotlight === "offers") {
      router.push("/explore-restaurant");
      return;
    }

    const params = new URLSearchParams();
    if (searchText.trim()) {
      params.set("search", searchText.trim());
    } else if (spotlight === "fast-delivery") {
      params.set("search", "fast delivery");
    } else if (spotlight === "top-picks") {
      params.set("search", "top rated");
    }

    const query = params.toString();
    router.push(query ? `/browse-restaurants?${query}` : "/browse-restaurants");
  };

  const handleSpotlightChange = (value: string) => {
    setSpotlight(value);
  };

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top,#f7f8ff_0%,#f0f3ff_30%,#faf7f2_100%)] px-3 py-3 md:px-6 md:py-5`}>
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[34px] border border-white/70 bg-[#fffdf9] shadow-[0_28px_120px_rgba(40,29,21,0.16)]">
        <header className="border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-4 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-[0_10px_24px_rgba(255,120,68,0.18)]">
                <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain p-2" />
              </div>
              <div>
                <p className={`${headingFont.className} text-lg font-extrabold text-[#15131a] md:text-xl`}>
                  KhanaSathi
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8d8795]">Food delivered with flair</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 text-sm font-semibold text-[#3c3646] lg:flex">
              <Link href="/browse-restaurants" className="transition hover:text-[#ff3157]">
                Restaurants
              </Link>
              <Link href="/explore-restaurant" className="transition hover:text-[#ff3157]">
                Best Offers
              </Link>
              <Link href="/browse-restaurants" className="transition hover:text-[#ff3157]">
                Fast Delivery
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href={user ? "/cart" : "/login"}
                className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-[#1c1b20] shadow-[0_10px_24px_rgba(14,16,24,0.08)] md:inline-flex"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#8cc63f]" />
              </Link>

              {user ? (
                <>
                  <Link
                    href={profileHref}
                    className="hidden rounded-full bg-[#ffcf40] px-5 py-3 text-sm font-bold text-[#251d10] shadow-[0_14px_30px_rgba(255,207,64,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ffc528] md:inline-flex"
                  >
                    Continue
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="hidden rounded-full border border-black/10 px-4 py-3 text-sm font-semibold text-[#4e4757] transition hover:border-[#ff3157] hover:text-[#ff3157] md:inline-flex"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden rounded-full bg-[#ffcf40] px-5 py-3 text-sm font-bold text-[#251d10] shadow-[0_14px_30px_rgba(255,207,64,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ffc528] md:inline-flex"
                >
                  Login / Signup
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/8 bg-white text-[#1d1c20] shadow-[0_10px_24px_rgba(14,16,24,0.08)] lg:hidden"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="border-t border-black/5 px-5 py-4 lg:hidden">
              <div className="flex flex-col gap-3 text-sm font-semibold text-[#3c3646]">
                <Link href="/browse-restaurants" onClick={() => setIsMenuOpen(false)}>
                  Restaurants
                </Link>
                <Link href="/explore-restaurant" onClick={() => setIsMenuOpen(false)}>
                  Best Offers
                </Link>
                {user ? (
                  <Link href={profileHref} onClick={() => setIsMenuOpen(false)}>
                    Continue
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    Login / Signup
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>

        <main>
          <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f4f6ff_48%,#f7f8fb_100%)] px-5 pb-16 pt-8 md:px-10 md:pb-20 md:pt-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-8 top-24 h-24 w-24 rounded-full border border-[#d7cfbf]" />
              <div className="absolute bottom-6 left-8 h-44 w-44 rounded-[44px] border border-[#d7cfbf] opacity-70" />
              <div className="absolute right-8 top-20 h-20 w-20 rounded-full border border-[#d7cfbf]" />
              <div className="absolute bottom-8 right-[32%] h-32 w-32 rounded-full border border-[#d7cfbf]" />
            </div>

            <div className="mx-auto grid max-w-[1360px] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
              <div className="relative z-10 max-w-[560px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ffe0b0] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#8f5b10] shadow-[0_10px_30px_rgba(255,170,60,0.12)]">
                  <Sparkles className="h-4 w-4 text-[#ffb000]" />
                  Arriving with flavor every day
                </div>

                <h1 className={`${headingFont.className} text-[2.8rem] font-extrabold leading-[0.95] text-[#121018] md:text-[4.5rem]`}>
                  Best Food for
                  <span className="mt-3 block w-fit rounded-[22px] bg-[#ffd739] px-3 py-1.5 text-[#0f1015]">
                    Best Restaurants
                  </span>
                </h1>

                <p className="mt-5 max-w-[470px] text-sm uppercase tracking-[0.26em] text-[#827c88]">
                  Curated city favorites, quick doorstep delivery, and fresh chef-made meals all week long.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="relative">
                    <select
                      value={spotlight}
                      onChange={(event) => handleSpotlightChange(event.target.value)}
                      className="h-14 w-full appearance-none rounded-2xl border border-black/10 bg-white px-5 pr-12 text-sm font-semibold text-[#272330] shadow-[0_12px_30px_rgba(17,20,29,0.08)] outline-none transition focus:border-[#ff3157]"
                    >
                      <option value="restaurants">Our Restaurants</option>
                      <option value="fast-delivery">Fast Delivery Picks</option>
                      <option value="top-picks">Top Rated Meals</option>
                      <option value="offers">Best Offers</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7e7788]" />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8491]" />
                      <input
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search burgers, pasta, momos..."
                        className="h-14 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm text-[#221f2a] shadow-[0_12px_30px_rgba(17,20,29,0.08)] outline-none transition focus:border-[#ff3157]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleExplore}
                      className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#ff3157] px-8 text-sm font-bold text-white shadow-[0_18px_40px_rgba(255,49,87,0.34)] transition hover:-translate-y-0.5 hover:bg-[#f1234c]"
                    >
                      Explore menu
                    </button>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3 text-sm">
                  {["Fresh chef-made meals", "Fast doorstep delivery", "Curated daily offers"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-black/6 bg-white px-4 py-2 font-semibold text-[#4a4355] shadow-[0_8px_18px_rgba(17,20,29,0.06)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[420px] lg:min-h-[520px]">
                <div className="absolute right-0 top-0 rounded-full bg-white px-5 py-3 shadow-[0_18px_40px_rgba(17,20,29,0.08)]">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[#ffdb2d] px-3 py-2 text-xs font-black text-[#1d1b1f]">90%</div>
                    <div className="text-sm font-bold leading-tight text-[#18161d]">
                      Free Delivery 7
                      <br />
                      Days a Week
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 h-[54%] w-[78%] rounded-tl-[90px] rounded-bl-[42px] rounded-tr-[36px] bg-[#ff3157]" />

                {heroImages.map((item) => (
                  <div key={item.title} className={item.className}>
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                ))}

                <div className="absolute bottom-10 left-[46%] flex gap-4">
                  <div className="h-7 w-4 rotate-[18deg] rounded-full bg-[#83cd3f] shadow-[0_12px_22px_rgba(131,205,63,0.35)]" />
                  <div className="mt-3 h-8 w-4 -rotate-[22deg] rounded-full bg-[#7bc738] shadow-[0_12px_22px_rgba(131,205,63,0.35)]" />
                  <div className="h-7 w-4 rotate-[28deg] rounded-full bg-[#95d854] shadow-[0_12px_22px_rgba(131,205,63,0.35)]" />
                </div>

                <div className="absolute right-4 top-24 hidden text-[#a69e94] md:block">
                  <Clock3 className="h-24 w-24" strokeWidth={1} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white px-5 py-18 md:px-10 md:py-24">
            <div className="mx-auto max-w-[1180px]">
              <div className="mb-12 text-center">
                <h2 className={`${headingFont.className} text-3xl font-extrabold text-[#17141d] md:text-4xl`}>
                  Best Offer For You
                </h2>
                <p className="mt-3 text-sm text-[#7f7886]">
                  Designed like your reference, but adapted to KhanaSathi with a cleaner live homepage layout.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.18fr_0.95fr]">
                <div className="space-y-5">
                  {leftOffers.map((offer) => (
                    <CompactOfferCard key={offer.name} {...offer} />
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-[30px] border border-black/6 bg-white p-3 shadow-[0_24px_60px_rgba(18,23,36,0.11)]">
                  <div className="relative h-[440px] overflow-hidden rounded-[24px]">
                    <Image
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80"
                      alt="BBQ Chicken & Pork"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent p-5 text-white">
                      <div className="mb-4 flex gap-2">
                        {[
                          { value: "26", label: "Days" },
                          { value: "04", label: "Hours" },
                          { value: "56", label: "Mins" },
                          { value: "28", label: "Secs" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-white/90 px-3 py-2 text-center text-[#19161c]">
                            <p className="text-sm font-extrabold">{item.value}</p>
                            <p className="text-[10px] uppercase tracking-wide text-[#726a79]">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      {renderStars()}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xl font-bold">BBQ Chicken & Pork</p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="font-bold text-[#ffd739]">Rs. 520</span>
                            <span className="text-sm text-white/65 line-through">Rs. 640</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#ff3157] shadow-[0_12px_22px_rgba(255,255,255,0.24)] transition hover:scale-105"
                        >
                          <ShoppingBag className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {rightOffers.map((offer) => (
                    <CompactOfferCard key={offer.name} {...offer} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 pb-18 pt-2 md:px-10 md:pb-24">
            <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[34px] bg-[#ff234d] px-7 py-8 text-white shadow-[0_28px_80px_rgba(255,35,77,0.28)] md:px-14 md:py-10">
              <div className="grid items-center gap-8 md:grid-cols-[0.88fr_1.12fr]">
                <div className="max-w-[420px]">
                  <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#ffd74c]">
                    Crispy, every bite taste
                  </p>
                  <h2 className={`${headingFont.className} mt-4 text-4xl font-extrabold leading-[0.95] md:text-6xl`}>
                    30 Minutes Fast
                    <span className="mt-2 block text-[#ffd739]">Delivery Challenge</span>
                  </h2>
                  <p className="mt-5 text-sm text-white/80">
                    Public landing page refreshed with a bold promotional block, just like the reference direction you shared.
                  </p>
                  <Link
                    href="/browse-restaurants"
                    className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#ff234d] shadow-[0_16px_34px_rgba(255,255,255,0.25)] transition hover:-translate-y-0.5"
                  >
                    Order Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="relative min-h-[260px]">
                  <div className="absolute -left-4 top-10 h-28 w-28 rounded-full bg-[#ff6a86] blur-2xl opacity-60" />
                  <div className="absolute bottom-2 right-8 h-32 w-32 rounded-full bg-[#ffb500] blur-3xl opacity-25" />
                  <div className="relative mx-auto h-[300px] max-w-[420px] md:h-[360px]">
                    <Image src="/Character.svg" alt="Delivery rider" fill className="object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,0.18)]" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-16">
            <div className="grid gap-0 md:grid-cols-5">
              {galleryImages.map((image, index) => (
                <div key={image} className="relative h-[180px] overflow-hidden md:h-[250px]">
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
      </div>
    </div>
  );
}
