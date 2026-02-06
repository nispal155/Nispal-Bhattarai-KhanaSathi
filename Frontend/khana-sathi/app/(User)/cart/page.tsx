"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, Loader2, Users, Share2, Clipboard, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyPromoCode,
  removePromoCode,
  shareCart,
  joinCart as apiJoinCart
} from "@/lib/cartService";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import UserHeader from "@/components/layout/UserHeader";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5003";

interface CartItem {
  _id: string;
  menuItem: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  };
  name: string;
  price: number;
  image?: string;
  quantity: number;
  specialInstructions?: string;
  addedBy?: {
    _id: string;
    username: string;
  };
}

interface RestaurantGroup {
  restaurant: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  items: CartItem[];
}

interface CartData {
  _id: string;
  restaurantGroups: RestaurantGroup[];
  promoCode?: string;
  promoDiscount?: number;
  isShared: boolean;
  shareCode?: string;
  collaborators: {
    _id: string;
    username: string;
    profilePicture?: string;
  }[];
  user: {
    _id: string;
    username: string;
  };
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    fetchCart();

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("token") }
    });

    newSocket.on("cartUpdated", (updatedCart: CartData) => {
      setCart(updatedCart);
      toast.success("Cart updated by collaborator", { id: "cart-update" });
    });

    newSocket.on("userJoinedCart", ({ user, cart }: { user: any, cart: CartData }) => {
      setCart(cart);
      toast.success(`${user.username} joined the cart!`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (cart?.isShared && cart.shareCode && socket) {
      socket.emit("join", cart.shareCode);
    }
  }, [cart?.isShared, cart?.shareCode, socket]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const responseData = response?.data as any;
      const cartData = responseData?.data || responseData;
      setCart(cartData as CartData || null);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setUpdating(menuItemId);
      await updateCartItem(menuItemId, quantity);
      await fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (menuItemId: string) => {
    try {
      setUpdating(menuItemId);
      await removeFromCart(menuItemId);
      await fetchCart();
    } catch (err) {
      console.error("Error removing item:", err);
    } finally {
      setUpdating(null);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setPromoError("");
      setPromoSuccess("");
      await applyPromoCode(promoCode);
      setPromoSuccess("Promo code applied!");
      await fetchCart();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPromoError(error.response?.data?.message || "Invalid promo code");
    }
  };

  const handleRemovePromo = async () => {
    try {
      await removePromoCode();
      setPromoCode("");
      setPromoSuccess("");
      await fetchCart();
    } catch (err) {
      console.error("Error removing promo:", err);
    }
  };

  const handleShareCart = async () => {
    try {
      const response = await shareCart();
      if (response.data?.success) {
        setCart(response.data.data as any);
        toast.success("Group ordering enabled!");
      }
    } catch (err) {
      toast.error("Failed to enable group ordering");
    }
  };

  const handleJoinCart = async () => {
    if (!joinCode.trim()) return;
    try {
      const response = await apiJoinCart(joinCode);
      if (response.data?.success) {
        setCart(response.data.data as any);
        setJoinCode("");
        toast.success("Joined group cart!");
      } else {
        toast.error(response.data?.message || "Failed to join cart");
      }
    } catch (err) {
      toast.error("Invalid share code");
    }
  };

  const copyShareCode = () => {
    if (cart?.shareCode) {
      navigator.clipboard.writeText(cart.shareCode);
      toast.success("Code copied to clipboard!");
    }
  };

  // Calculate subtotal across all groups
  const subtotal = cart?.restaurantGroups.reduce((acc, group) => {
    return acc + group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, 0) || 0;

  const deliveryFee = (cart?.restaurantGroups.length || 0) * 50;
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

  const hasItems = cart && cart.restaurantGroups.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/browse-restaurants"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Continue Shopping</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Cart</h1>

        {!hasItems ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious food to get started!</p>
            <Link
              href="/browse-restaurants"
              className="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-8"
            >
              Browse Restaurants
            </Link>

            <div className="mt-12 max-w-sm mx-auto p-6 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-900 font-semibold mb-2">Join a friend's cart</p>
              <p className="text-gray-500 text-sm mb-4">Enter the 8-character code to start ordering together.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter share code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 uppercase font-mono tracking-widest"
                />
                <button
                  onClick={handleJoinCart}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {cart.restaurantGroups.map((group) => (
                <div key={group.restaurant._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">
                      {group.restaurant.name}
                    </h2>
                    <span className="text-xs text-gray-500">{group.items.length} items</span>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <div key={item._id} className="p-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            <Image
                              src={item.image || "/food-placeholder.jpg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.specialInstructions && (
                                    <p className="text-xs text-orange-600">Note: {item.specialInstructions}</p>
                                  )}
                                  {cart.isShared && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                      Added by {item.addedBy?.username || "Guest"}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => removeItem(item.menuItem._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                                  disabled={updating === item.menuItem._id || item.quantity <= 1}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-medium w-4 text-center">
                                  {updating === item.menuItem._id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                                  disabled={updating === item.menuItem._id}
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                Rs. {item.price * item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Shared Cart Header Info */}
              {cart && cart.isShared ? (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Users className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Group Order Active</h3>
                      <p className="text-sm text-gray-600">{(cart.collaborators?.length || 0) + 1} people in this cart</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                      <span className="text-sm font-mono font-bold tracking-widest">{cart.shareCode}</span>
                      <button onClick={copyShareCode} className="text-gray-400 hover:text-red-500 transition">
                        <Clipboard className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={copyShareCode} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> Share Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Order with Friends</h3>
                  <p className="text-sm text-gray-500 mb-6">Split the bill and share delivery fees by ordering together.</p>
                  <button
                    onClick={handleShareCart}
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition"
                  >
                    <Users className="w-4 h-4" /> Start Group Order
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">Rs. {subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee ({cart.restaurantGroups.length} rest.)</span>
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

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900 text-lg">Rs. {total}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {cart.promoCode ? (
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div>
                        <span className="text-green-700 font-medium">{cart.promoCode}</span>
                        <span className="text-green-600 text-xs ml-2">Applied!</span>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-red-500 text-xs hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          onClick={handleApplyPromo}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <p className="text-red-500 text-xs mt-2">{promoError}</p>}
                    </>
                  )}
                </div>

                <Link
                  href="/user-payment"
                  className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  Proceed to Checkout
                </Link>

                {cart.isShared && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> Split Bill Preview
                    </p>
                    <div className="mt-2 space-y-1">
                      {/* Subtotal by user */}
                      {(() => {
                        const userTotals: Record<string, { username: string, total: number }> = {};
                        cart.restaurantGroups.forEach(group => {
                          group.items.forEach(item => {
                            const uid = item.addedBy?._id || 'guest';
                            const uname = item.addedBy?.username || 'Guest';
                            if (!userTotals[uid]) userTotals[uid] = { username: uname, total: 0 };
                            userTotals[uid].total += item.price * item.quantity;
                          });
                        });
                        return Object.entries(userTotals).map(([id, ut]) => (
                          <div key={id} className="flex justify-between text-[11px] text-blue-700">
                            <span>{ut.username}</span>
                            <span>Rs. {ut.total}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
