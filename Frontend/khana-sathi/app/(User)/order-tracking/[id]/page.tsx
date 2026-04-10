"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Phone, MessageSquare, MapPin, Clock, Loader2, Store, Star } from "lucide-react";
import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderById, cancelOrder } from "@/lib/orderService";
import { createReview } from "@/lib/reviewService";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import UserHeader from "@/components/layout/UserHeader";
import ChatWindow from "@/components/Chat/ChatWindow";
import TrackingStatusPanel from "@/components/tracking/TrackingStatusPanel";
import { useLiveOrderTracking } from "@/hooks/tracking/useLiveOrderTracking";

const TrackingMap = dynamic(() => import("@/components/tracking/TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
      <Loader2 className="h-6 w-6 animate-spin text-red-500" />
    </div>
  ),
});

type ChatRecipient = 'restaurant' | 'rider' | null;

interface OrderItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  restaurant: {
    _id: string;
    name: string;
    address: {
      addressLine1: string;
      city: string;
      state?: string;
      coordinates?: {
        lat?: number;
        lng?: number;
      };
    };
    logoUrl?: string;
  };
  items: OrderItem[];
  status: string;
  deliveryAddress: {
    addressLine1: string;
    city: string;
    state: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  deliveryRider?: {
    _id: string;
    name?: string;
    username?: string;
    phone?: string;
    profilePicture?: string;
    averageRating?: number;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  isRated?: boolean;
  estimatedDeliveryTime?: Date;
  createdAt: string;
  riderLocationHistory?: Array<{
    lat: number;
    lng: number;
    timestamp?: string;
  }>;
}

const formatAddress = (parts: Array<string | undefined>) => parts.filter(Boolean).join(", ");
const getRiderName = (rider?: Order["deliveryRider"]) => rider?.name || rider?.username || "Delivery rider";

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const { socket, joinOrder, leaveOrder, onOrderUpdate, onRiderAssigned } = useSocket();
  const [chatRecipient, setChatRecipient] = useState<ChatRecipient>(null);
  const { user: authUser } = useAuth();

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [restaurantReview, setRestaurantReview] = useState("");
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryReview, setDeliveryReview] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const isDemoMode = searchParams.get("demo") === "1";
  const tracking = useLiveOrderTracking(order, { demoMode: isDemoMode });

  useEffect(() => {
    fetchOrder();

    if (!socket) return;

    console.log("Joining order room via global socket:", id);
    joinOrder(id);

    const unsubscribeOrderUpdate = onOrderUpdate((data) => {
      if (data.orderId === id) {
        setOrder(prev => prev ? { ...prev, status: (data.status as string) } : null);
        // Re-fetch full order to get updated rider info etc.
        fetchOrder();
      }
    });

    const unsubscribeRiderAssigned = onRiderAssigned((data) => {
      if (data.orderId === id && data.rider && data.rider._id) {
        const rider = data.rider;
        setOrder(prev => prev ? {
          ...prev,
          deliveryRider: {
            _id: rider._id as string,
            name: rider.username || rider.name || 'Rider',
            phone: rider.phone,
            profilePicture: rider.profilePicture,
            averageRating: rider.averageRating,
          }
        } : null);
      }
    });

    // Polling as fallback
    const interval = setInterval(fetchOrder, 60000);

    return () => {
      clearInterval(interval);
      leaveOrder(id);
      unsubscribeOrderUpdate();
      unsubscribeRiderAssigned();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, socket, joinOrder, leaveOrder, onOrderUpdate, onRiderAssigned]);

  // Cancellation timer logic
  useEffect(() => {
    if (!order || order.status !== 'pending') {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const created = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const difference = (created + 120000) - now; // 2 minutes window

      if (difference <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(Math.floor(difference / 1000));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [order]);

  const fetchOrder = async () => {
    try {
      const response = await getOrderById(id);
      // Handle nested response structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response?.data as any;
      const orderData = responseData?.data || responseData;

      setOrder(orderData as Order);
      setError("");
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancelling(true);
      await cancelOrder(id, "Customer requested cancellation");
      await fetchOrder();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (overallRating === 0) {
      alert("Please provide an overall rating");
      return;
    }
    try {
      setSubmittingReview(true);
      await createReview({
        orderId: id,
        restaurantRating: restaurantRating || undefined,
        foodRating: foodRating || undefined,
        restaurantReview: restaurantReview || undefined,
        deliveryRating: deliveryRating || undefined,
        deliveryReview: deliveryReview || undefined,
        overallRating,
        comment: restaurantReview || undefined,
      });
      setReviewSubmitted(true);
      setShowReviewForm(false);
      // Update order locally so the form doesn't show again
      setOrder(prev => prev ? { ...prev, isRated: true } : null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Order not found"}</p>
        <Link href="/profile" className="text-red-500 hover:underline">
          View All Orders
        </Link>
      </div>
    );
  }

  const isCancellable = order.status === "pending" && (timeLeft !== null && timeLeft > 0);
  const destinationText = formatAddress([
    order.deliveryAddress.addressLine1,
    order.deliveryAddress.city,
    order.deliveryAddress.state,
  ]);
  const restaurantText = formatAddress([
    order.restaurant.address.addressLine1,
    order.restaurant.address.city,
    order.restaurant.address.state,
  ]);
  const riderName = getRiderName(order.deliveryRider);
  const etaLabel =
    tracking.etaMinutes === null
      ? "ETA unavailable"
      : tracking.etaMinutes === 0
        ? "Delivered"
        : `${tracking.etaMinutes} min`;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600 text-sm">From {order.restaurant.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {order.status !== "cancelled" && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{etaLabel}</span>
                </div>
              )}
              {isDemoMode && (
                <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
                  Demo mode
                </div>
              )}
              {order.status === "cancelled" && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full">
                  <span className="font-medium">Cancelled</span>
                </div>
              )}
              {order.status === "delivered" && (
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full">
                  <span className="font-medium">Delivered</span>
                </div>
              )}
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              This order was cancelled before live delivery tracking could continue.
            </div>
          ) : (
            <TrackingStatusPanel
              tracking={tracking}
              restaurantName={order.restaurant.name}
              destinationText={destinationText}
            />
          )}
        </div>

        <div className={`grid grid-cols-1 gap-6 ${order.deliveryRider ? "lg:grid-cols-2" : ""}`}>
          {/* Rider Info */}
          {order.deliveryRider && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Delivery Partner</h2>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                  <Image
                    src={order.deliveryRider.profilePicture || "/Character.svg"}
                    alt={riderName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{riderName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-yellow-500">&#9733;</span>
                    <span>
                      {typeof order.deliveryRider.averageRating === "number"
                        ? `${order.deliveryRider.averageRating.toFixed(1)} Rating`
                        : "Live rider assigned"}
                    </span>
                  </div>
                  {tracking.lastUpdatedLabel && (
                    <p className="mt-1 text-xs text-gray-500">{tracking.lastUpdatedLabel}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {order.deliveryRider.phone && (
                  <a
                    href={`tel:${order.deliveryRider.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </a>
                )}
                <button
                  onClick={() => setChatRecipient('rider')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  Message
                </button>
              </div>
            </div>
          )}

          {/* Delivery Map */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Delivery tracking map</h2>
                  <p className="text-gray-600 text-sm">{destinationText}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  tracking.isDemoMode
                    ? "bg-amber-100 text-amber-700"
                    : tracking.canTrackLive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}>
                  {tracking.isDemoMode ? "Demo route" : tracking.canTrackLive ? "Live updates" : "Waiting for rider"}
                </span>
              </div>
            </div>

            <TrackingMap
              tracking={tracking}
              destinationLabel={destinationText}
              restaurantLabel={restaurantText || order.restaurant.name}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup address</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{restaurantText || "Restaurant address unavailable"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customer address</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{destinationText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Order Items</h2>
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <button
                onClick={() => setChatRecipient('restaurant')}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                <Store className="w-4 h-4" />
                Message Restaurant
              </button>
            )}
          </div>

          <div className="space-y-3">
            {order.items.map((item: OrderItem, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <span className="text-gray-900">{item.menuItem.name}</span>
                </div>
                <span className="font-medium text-gray-900">Rs. {item.price}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>Rs. {order.pricing.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              <span>Rs. {order.pricing.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee</span>
              <span>Rs. {order.pricing.serviceFee}</span>
            </div>
            {order.pricing.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-Rs. {order.pricing.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>Rs. {order.pricing.total}</span>
            </div>
          </div>
        </div>

        {/* Review & Rating Section */}
        {order.status === "delivered" && !order.isRated && !reviewSubmitted && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            {!showReviewForm ? (
              <div className="text-center py-4">
                <h2 className="font-semibold text-gray-900 text-lg mb-2">How was your experience?</h2>
                <p className="text-gray-500 text-sm mb-4">Rate your order to help others and improve service</p>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold text-gray-900 text-lg mb-6">Rate Your Order</h2>

                {/* Overall Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setOverallRating(star)} className="focus:outline-none">
                        <Star
                          className={`w-8 h-8 transition-colors ${star <= overallRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Restaurant Rating */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">Restaurant - {order.restaurant.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Restaurant Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setRestaurantRating(star)} className="focus:outline-none">
                            <Star
                              className={`w-6 h-6 transition-colors ${star <= restaurantRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Food Quality</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setFoodRating(star)} className="focus:outline-none">
                            <Star
                              className={`w-6 h-6 transition-colors ${star <= foodRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={restaurantReview}
                    onChange={(e) => setRestaurantReview(e.target.value)}
                    placeholder="Share your experience with the restaurant..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                </div>

                {/* Delivery Rider Rating */}
                {order.deliveryRider && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">Delivery - {riderName}</h3>
                    <div className="mb-3">
                      <label className="block text-sm text-gray-600 mb-1">Delivery Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setDeliveryRating(star)} className="focus:outline-none">
                            <Star
                              className={`w-6 h-6 transition-colors ${star <= deliveryRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={deliveryReview}
                      onChange={(e) => setDeliveryReview(e.target.value)}
                      placeholder="How was your delivery experience?"
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                    />
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || overallRating === 0}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Submitted Confirmation */}
        {(order.status === "delivered" && (order.isRated || reviewSubmitted)) && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-semibold text-green-800">Thank you for your review!</h3>
            <p className="text-green-600 text-sm mt-1">Your feedback helps improve the service</p>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Need Help?</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Report an Issue
            </button>
            {isCancellable && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling ? "Cancelling..." : `Cancel (${Math.floor(timeLeft! / 60)}:${(timeLeft! % 60).toString().padStart(2, '0')})`}
              </button>
            )}
            {!isCancellable && order.status === 'pending' && timeLeft === 0 && (
              <span className="text-xs text-gray-400 self-center">Cancellation window closed</span>
            )}
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-red-500 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <p>&copy; 2025 KhanaSathi. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Window */}
      {authUser && chatRecipient && (
        <ChatWindow
          orderId={id}
          recipientName={chatRecipient === 'rider' ? riderName : order.restaurant.name}
          recipientRole={chatRecipient === 'rider' ? 'delivery_staff' : 'restaurant'}
          chatThread={chatRecipient === 'rider' ? 'customer-rider' : 'customer-restaurant'}
          onClose={() => setChatRecipient(null)}
        />
      )}
    </div>
  );
}
