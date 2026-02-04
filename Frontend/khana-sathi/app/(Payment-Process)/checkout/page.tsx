"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getCart, getCartSummary } from "@/lib/cartService";
import { getProfile, getAddresses, UserProfile, Address } from "@/lib/userService";
import { createOrder, DeliveryAddress } from "@/lib/orderService";
import { Cart, RestaurantGroup } from "@/lib/cartService";
import { initiateEsewaFromCart, initiateKhaltiFromCart, redirectToEsewa, redirectToKhalti } from "@/lib/paymentService";

type CartData = Cart;

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
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

      setCart(cartData as Cart);
      setProfile(profileData as UserProfile);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);

      // Pre-fill form with profile data
      if (profileData && 'username' in profileData) {
        const name = profileData.username || "";
        const nameParts = name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
        setPhone(profileData.phone || "");
        setEmail(profileData.email || "");
      }

      // Select default address
      const addrList = Array.isArray(addressesData) ? addressesData : [];
      const defaultAddr = addrList.find((a) => a.isDefault);
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

    const deliveryAddress = {
      addressLine1: selectedAddress.addressLine1,
      city: selectedAddress.city,
      state: selectedAddress.state || "",
      zipCode: selectedAddress.zipCode || "",
    };

    try {
      setSubmitting(true);

      // Different flow based on payment method
      if (paymentMethod === "cod") {
        // COD: Create order directly
        console.log("Creating COD order...");
        const orderData = {
          deliveryAddress,
          paymentMethod,
          specialInstructions,
          useLoyaltyPoints,
          promoCode: cart.promoCode
        };

        const response: any = await createOrder(orderData);
        const responseData = response?.data?.data || response?.data;
        const orders = Array.isArray(responseData) ? responseData : [responseData];
        const firstOrder = orders[0];
        
        if (firstOrder?._id) {
          router.push(`/order-tracking/${firstOrder._id}`);
        } else {
          router.push("/user-profile?tab=orders");
        }
      } else if (paymentMethod === "esewa") {
        // eSewa: Redirect to payment first, order created after successful payment
        console.log("Initiating eSewa payment...");
        try {
          const esewaRes = await initiateEsewaFromCart({
            deliveryAddress,
            specialInstructions,
            useLoyaltyPoints
          });
          console.log("eSewa response:", JSON.stringify(esewaRes, null, 2));
          
          // Check for API errors first
          if (esewaRes.error) {
            console.error("eSewa API error:", esewaRes.error);
            alert(`eSewa payment error: ${esewaRes.error}`);
            setSubmitting(false);
            return;
          }
          
          if (esewaRes.data?.success && esewaRes.data.data) {
            console.log("Redirecting to eSewa payment gateway...");
            console.log("Payment URL:", esewaRes.data.data.paymentUrl);
            console.log("Form Data:", JSON.stringify(esewaRes.data.data.formData, null, 2));
            redirectToEsewa(esewaRes.data.data);
            return; // Don't set submitting to false - we're leaving the page
          } else {
            console.error("eSewa initiation failed:", esewaRes);
            alert("Failed to initiate eSewa payment. Please try again.");
            setSubmitting(false);
          }
        } catch (esewaError) {
          console.error("eSewa payment error:", esewaError);
          alert("Failed to initiate eSewa payment. Please try again.");
          setSubmitting(false);
        }
      } else if (paymentMethod === "khalti") {
        // Khalti: Redirect to payment first, order created after successful payment
        console.log("Initiating Khalti payment...");
        try {
          const khaltiRes = await initiateKhaltiFromCart({
            deliveryAddress,
            specialInstructions,
            useLoyaltyPoints
          });
          console.log("Khalti response:", JSON.stringify(khaltiRes, null, 2));
          
          // Check for API errors first
          if (khaltiRes.error) {
            console.error("Khalti API error:", khaltiRes.error);
            alert(`Khalti payment error: ${khaltiRes.error}`);
            setSubmitting(false);
            return;
          }
          
          if (khaltiRes.data?.success && khaltiRes.data.data?.paymentUrl) {
            console.log("Redirecting to Khalti payment gateway...");
            console.log("Payment URL:", khaltiRes.data.data.paymentUrl);
            redirectToKhalti(khaltiRes.data.data.paymentUrl);
            return; // Don't set submitting to false - we're leaving the page
          } else {
            console.error("Khalti initiation failed:", khaltiRes);
            alert("Failed to initiate Khalti payment. Please try again.");
            setSubmitting(false);
          }
        } catch (khaltiError) {
          console.error("Khalti payment error:", khaltiError);
          alert("Failed to initiate Khalti payment. Please try again.");
          setSubmitting(false);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Order/Payment error:", error);
      alert(error.response?.data?.message || "Failed to process. Please try again.");
      setSubmitting(false);
    }
  };

  const subtotal = cart?.restaurantGroups.reduce((acc, group) => {
    return acc + group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, 0) || 0;

  const deliveryFee = (cart?.restaurantGroups.length || 0) * 50;
  const serviceFee = 20;
  const discount = (cart?.promoDiscount || 0) + (useLoyaltyPoints ? Math.min(profile?.loyaltyPoints || 0, subtotal + deliveryFee + serviceFee - (cart?.promoDiscount || 0)) : 0);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!cart || cart.restaurantGroups.length === 0) {
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
                      className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition ${selectedAddressId === address._id
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
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${paymentMethod === "cod"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span className="font-medium text-gray-900">💵 Cash on Delivery</span>
                    <p className="text-sm text-gray-500">Pay when your order arrives</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${paymentMethod === "esewa"
                    ? "border-green-500 bg-green-50"
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
                  <div className="flex items-center gap-3">
                    <Image src="/Esewa.svg" alt="eSewa" width={40} height={40} className="object-contain" />
                    <div>
                      <span className="font-medium text-gray-900">eSewa</span>
                      <p className="text-sm text-gray-500">Pay using eSewa digital wallet</p>
                    </div>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${paymentMethod === "khalti"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="khalti"
                    checked={paymentMethod === "khalti"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="flex items-center gap-3">
                    <Image src="/Khalti.svg" alt="Khalti" width={40} height={40} className="object-contain" />
                    <div>
                      <span className="font-medium text-gray-900">Khalti</span>
                      <p className="text-sm text-gray-500">Pay using Khalti digital wallet</p>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Payment Info Note */}
              {(paymentMethod === "esewa" || paymentMethod === "khalti") && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Note:</span> You will be redirected to {paymentMethod === "esewa" ? "eSewa" : "Khalti"} to complete your payment securely. 
                    Your order will be confirmed once payment is successful.
                  </p>
                </div>
              )}
            </section>

            {/* Loyalty Points */}
            {profile && profile.loyaltyPoints > 0 && (
              <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-orange-900">Loyalty Points</h2>
                    <p className="text-orange-700 text-sm">You have {profile.loyaltyPoints} points available (Rs. {profile.loyaltyPoints})</p>
                  </div>
                  <button
                    onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                    className={`px-6 py-2 rounded-full font-semibold transition ${useLoyaltyPoints ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-600 hover:bg-orange-100'}`}
                  >
                    {useLoyaltyPoints ? 'Applied' : 'Apply Points'}
                  </button>
                </div>
              </section>
            )}

            {/* Special Instructions */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Instructions</h2>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests or delivery instructions for this order..."
                className="w-full px-5 py-4 text-black bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition resize-none"
                rows={3}
              />
            </section>

            {/* Continue Button */}
            <div className="pt-8">
              <button
                onClick={handlePlaceOrder}
                disabled={submitting || !selectedAddressId}
                className={`${paymentMethod === "esewa" ? "bg-green-600 hover:bg-green-700" : paymentMethod === "khalti" ? "bg-purple-600 hover:bg-purple-700" : "bg-yellow-500 hover:bg-yellow-600"} text-white font-bold text-xl px-16 py-5 rounded-full shadow-xl transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {paymentMethod === "esewa" || paymentMethod === "khalti" ? "Redirecting to Payment..." : "Placing Order..."}
                  </>
                ) : (
                  paymentMethod === "esewa" ? "Pay with eSewa" : 
                  paymentMethod === "khalti" ? "Pay with Khalti" : 
                  "Place Order"
                )}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-24">
              <h3 className="text-xl text-black font-bold mb-6">Order Summary</h3>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {cart.restaurantGroups.map((group) => (
                  <div key={group.restaurant._id} className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{group.restaurant.name}</h4>
                    {group.items.map((item, itemIndex) => (
                      <div key={`${group.restaurant._id}-${typeof item.menuItem === 'object' ? (item.menuItem as any)?._id : item.menuItem}-${itemIndex}`} className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          <Image
                            src={item.image || "/food-placeholder.jpg"}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-xs">{item.name}</h4>
                          <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                          {item.specialInstructions && (
                            <p className="text-[10px] text-orange-600 italic">"{item.specialInstructions}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black text-sm">Rs. {item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
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
