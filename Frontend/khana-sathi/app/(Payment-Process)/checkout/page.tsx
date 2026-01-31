"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getCart, getCartSummary } from "@/lib/cartService";
import { getProfile, getAddresses } from "@/lib/userService";
import { createOrder } from "@/lib/orderService";

interface CartItem {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

interface CartData {
  _id: string;
  restaurant: {
    _id: string;
    name: string;
  };
  items: CartItem[];
  promoCode?: string;
  promoDiscount?: number;
}

interface Address {
  _id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartRes, profileRes, addressesRes] = await Promise.all([
        getCart(),
        getProfile(),
        getAddresses(),
      ]);
      
      // Handle nested response structure
      const cartData = cartRes?.data?.data || cartRes?.data;
      const profileData = profileRes?.data?.data || profileRes?.data;
      const addressesData = addressesRes?.data?.data || addressesRes?.data || [];
      
      setCart(cartData as CartData);
      setProfile(profileData as UserProfile);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      
      // Pre-fill form with profile data
      if (profileData) {
        const name = profileData.name || profileData.username || "";
        const nameParts = name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setPhone(profileData.phone || "");
        setEmail(profileData.email || "");
      }
      
      // Select default address
      const addrList = Array.isArray(addressesData) ? addressesData : [];
      const defaultAddr = addrList.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      } else if (addrList.length > 0) {
        setSelectedAddressId(addrList[0]._id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || !selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    const selectedAddress = addresses.find(a => a._id === selectedAddressId);
    if (!selectedAddress) {
      alert("Please select a valid delivery address");
      return;
    }

    try {
      setSubmitting(true);
      
      const orderData = {
        restaurant: cart.restaurant._id,
        items: cart.items.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          price: item.menuItem.price * item.quantity,
          specialInstructions: "",
        })),
        deliveryAddress: {
          addressLine1: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
        },
        paymentMethod,
        specialInstructions,
      };

      const response = await createOrder(orderData);
      
      // Redirect based on payment method
      if (paymentMethod === "cash_on_delivery") {
        router.push(`/order-tracking/${response.data._id}`);
      } else {
        router.push("/payment");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart?.items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  ) || 0;
  const deliveryFee = 50;
  const serviceFee = 20;
  const discount = cart?.promoDiscount || 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">Your cart is empty</p>
        <Link href="/browse-restaurants" className="text-red-500 hover:underline">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-orange-600">Khana</span>
              <span className="text-green-600">Sathi</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            

            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 shadow-md transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              Profile
            </button>

            <button className="p-2">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-center gap-12">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🛒
              </div>
              <div className="w-40 h-1 bg-gray-300"></div>
            </div>

            {/* Step 2 - Credit Card */}
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full flex items-center justify-center">
              <Image src="/credit-card.svg" alt="credit card" width={28} height={28} />
            </div>

            <div className="w-40 h-1 bg-gray-300"></div>

            {/* Step 3 */}
            <div className="w-12 h-12 border-4 border-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Checkout Form */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Form */}
          <div className="lg:col-span-2 space-y-10">
            {/* Personal Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-14 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>
            </section>

            {/* Delivery Details */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Address</h2>
              {addresses.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                  <p className="text-yellow-800 mb-4">No saved addresses found.</p>
                  <Link href="/user-profile" className="text-red-500 hover:underline">
                    Add an address in your profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition ${
                        selectedAddressId === address._id
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address._id}
                        checked={selectedAddressId === address._id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{address.label}</span>
                          {address.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600">{address.addressLine1}</p>
                        <p className="text-gray-600 text-sm">{address.city}, {address.state} {address.zipCode}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-4">
                <label
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${
                    paymentMethod === "cash_on_delivery"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span className="font-medium text-gray-900">💵 Cash on Delivery</span>
                    <p className="text-sm text-gray-500">Pay when your order arrives</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${
                    paymentMethod === "esewa"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="esewa"
                    checked={paymentMethod === "esewa"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span className="font-medium text-gray-900">💚 eSewa</span>
                    <p className="text-sm text-gray-500">Pay using eSewa wallet</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${
                    paymentMethod === "card"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span className="font-medium text-gray-900">💳 Credit/Debit Card</span>
                    <p className="text-sm text-gray-500">Pay securely with your card</p>
                  </div>
                </label>
              </div>
            </section>

            {/* Special Instructions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Special Instructions</h2>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or delivery instructions..."
                className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition resize-none"
                rows={3}
              />
            </section>

            {/* Continue Button */}
            <div className="pt-8">
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedAddressId}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xl px-16 py-5 rounded-full shadow-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-24">
              <h3 className="text-xl text-black font-bold mb-6">Order Summary</h3>
              <p className="text-sm text-gray-500 mb-4">From: {cart.restaurant?.name}</p>

              <div className="space-y-4 max-h-64 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-4">
                    <Image
                      src={item.menuItem.image || "/food-placeholder.jpg"}
                      alt={item.menuItem.name}
                      width={60}
                      height={60}
                      className="rounded-xl object-cover shadow-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.menuItem.name}</h4>
                      <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-black">Rs. {item.menuItem.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-8 pt-6 border-t-2 border-gray-200 space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>Rs. {deliveryFee}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee:</span>
                  <span>Rs. {serviceFee}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-Rs. {discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 border-t-2 border-gray-300">
                  <span>Total:</span>
                  <span>Rs. {total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
