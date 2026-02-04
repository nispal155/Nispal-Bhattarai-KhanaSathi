"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Wallet, Building2, Check, Loader2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCart, Cart } from "@/lib/cartService";
import { createOrder } from "@/lib/orderService";
import { initiateEsewaFromCart, initiateKhaltiFromCart, redirectToEsewa, redirectToKhalti } from "@/lib/paymentService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [isProcessing, setIsProcessing] = useState(false);

  // Address State
  const [address, setAddress] = useState({
    addressLine1: "",
    city: "Kathmandu",
    state: "Bagmati",
    zipCode: "44600",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to checkout");
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchCartData();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const cartData = responseData?.data || responseData;
      setCart(cartData);
    } catch (err) {
      console.error("Error fetching cart:", err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "esewa",
      name: "eSewa",
      icon: "💚",
      description: "Pay with your eSewa wallet",
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: "card",
      description: "Visa, Mastercard, or other cards",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "💵",
      description: "Pay when your order arrives",
    },
  ];

  const handlePayment = async () => {
    if (!cart) return;

    if (!address.addressLine1) {
      toast.error("Please enter a street address");
      return;
    }

    try {
      setIsProcessing(true);

      // Different flow based on payment method
      if (selectedPayment === "cod") {
        // COD: Create order directly
        const orderData = {
          deliveryAddress: address,
          paymentMethod: selectedPayment,
          specialInstructions: "",
        };

        console.log("Creating COD order:", orderData);
        const response = await createOrder(orderData);
        console.log("Order API response:", response);

        if (response.error) {
          console.error("API returned error:", response.error);
          toast.error(response.error);
          return;
        }

        const responseData = response?.data?.data || response?.data;
        const order = (Array.isArray(responseData) ? responseData[0] : responseData) as any;

        if (order && order._id) {
          toast.success("Order placed successfully!");
          router.push(`/order-tracking/${order._id}`);
        } else {
          toast.error("Order creation failed - no order returned");
        }
      } else if (selectedPayment === "esewa") {
        // eSewa: Redirect to payment first, order created after successful payment
        console.log("Initiating eSewa payment...");
        const esewaRes = await initiateEsewaFromCart({
          deliveryAddress: address,
          specialInstructions: "",
          useLoyaltyPoints: false
        });
        console.log("eSewa response:", esewaRes);

        if (esewaRes.error) {
          toast.error(esewaRes.error);
          return;
        }

        if (esewaRes.data?.success && esewaRes.data.data) {
          toast.success("Redirecting to eSewa...");
          redirectToEsewa(esewaRes.data.data);
          return; // Don't set isProcessing to false - we're leaving the page
        } else {
          toast.error("Failed to initiate eSewa payment");
        }
      } else if (selectedPayment === "khalti") {
        // Khalti: Redirect to payment first, order created after successful payment
        console.log("Initiating Khalti payment...");
        const khaltiRes = await initiateKhaltiFromCart({
          deliveryAddress: address,
          specialInstructions: "",
          useLoyaltyPoints: false
        });
        console.log("Khalti response:", khaltiRes);

        if (khaltiRes.error) {
          toast.error(khaltiRes.error);
          return;
        }

        if (khaltiRes.data?.success && khaltiRes.data.data?.paymentUrl) {
          toast.success("Redirecting to Khalti...");
          redirectToKhalti(khaltiRes.data.data.paymentUrl);
          return; // Don't set isProcessing to false - we're leaving the page
        } else {
          toast.error("Failed to initiate Khalti payment");
        }
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.message || err?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations - flatten restaurantGroups to calculate subtotal
  const subtotal = cart?.restaurantGroups?.reduce((acc, group) => {
    return acc + group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, 0) || 0;
  const deliveryFee = (cart?.restaurantGroups?.length || 0) * 50;
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

  if (!cart || !cart.restaurantGroups?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/browse-restaurants" className="text-red-500 underline">Browse Restaurants</Link>
      </div>
    )
  }

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
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/browse-restaurants" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🏠</span> Home
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>🛒</span> Cart
              </Link>
              <Link href="/user-profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <span>👤</span> Profile
              </Link>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center">
              <span className="text-pink-600 text-lg">👤</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Cart</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout & Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            {/* Delivery Address Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-red-500" />
                <h2 className="font-semibold text-gray-900">Delivery Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g. 123 Main St"
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded p-2"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded p-2"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Select Payment Method</h2>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${selectedPayment === method.id
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={() => setSelectedPayment(method.id)}
                      className="w-5 h-5 text-red-500 focus:ring-red-500"
                    />
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {method.icon === "card" ? (
                        <CreditCard className="w-6 h-6 text-gray-600" />
                      ) : (
                        <span className="text-2xl">{method.icon}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {selectedPayment === method.id && (
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Card Details Placeholders */}
            {selectedPayment === "card" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Card Details</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 italic">Card payment integration coming soon. Please choose COD for now.</p>
                </div>
              </div>
            )}

            {/* Wallet Login (shown for eSewa) */}
            {selectedPayment === "esewa" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">
                  eSewa Login
                </h2>
                <p className="text-gray-600 mb-4">
                  You will be redirected to eSewa to complete your payment.
                </p>
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Secure payment processing</span>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-6 text-sm mb-4 max-h-60 overflow-y-auto">
                {cart.restaurantGroups.map((group) => (
                  <div key={group.restaurant._id} className="space-y-3">
                    <h3 className="font-medium text-gray-900 border-b pb-2">{group.restaurant.name}</h3>
                    {group.items.map((item, itemIndex) => (
                      <div key={`${group.restaurant._id}-${typeof item.menuItem === 'object' ? (item.menuItem as any)?._id : item.menuItem}-${itemIndex}`} className="flex justify-between">
                        <span className="text-gray-600">
                          {item.name} <span className="text-xs">x{item.quantity}</span>
                        </span>
                        <span className="text-gray-900">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">Rs. {deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="text-gray-900">Rs. {serviceFee}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-Rs. {discount}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>Rs. {total}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Place Order - Rs. ${total}`
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                <span>🔒</span>
                <span>Secured by SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}

    </div>
  );
}
