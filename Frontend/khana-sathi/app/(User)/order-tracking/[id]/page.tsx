"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MessageSquare, MapPin, Clock, Loader2, Store, Star } from "lucide-react";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getOrderById, cancelOrder } from "@/lib/orderService";
import { createReview } from "@/lib/reviewService";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import UserHeader from "@/components/layout/UserHeader";
import ChatWindow from "@/components/Chat/ChatWindow";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5003";

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
    };
  };
  items: OrderItem[];
  status: string;
  deliveryAddress: {
    addressLine1: string;
    city: string;
    state: string;
  };
  deliveryRider?: {
    _id: string;
    name: string;
    phone?: string;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discount: number;
    total: number;
  };
  multiOrder?: string | { _id: string };
  isSubOrder?: boolean;
  isRated?: boolean;
  estimatedDeliveryTime?: Date;
  createdAt: string;
}

const statusSteps = [
  { id: 1, status: "pending", title: "Order Placed", description: "Waiting for confirmation" },
  { id: 2, status: "confirmed", title: "Confirmed", description: "Restaurant accepted your order" },
  { id: 3, status: "preparing", title: "Preparing", description: "Your food is being prepared" },
  { id: 4, status: "ready", title: "Ready", description: "Food is ready for pickup" },
  { id: 5, status: "picked_up", title: "Picked Up", description: "Rider has your food" },
  { id: 6, status: "on_the_way", title: "On the Way", description: "Rider is heading to you" },
  { id: 7, status: "delivered", title: "Delivered", description: "Enjoy your meal!" },
];

const getStepNumber = (status: string): number => {
  const step = statusSteps.find(s => s.status === status);
  return step ? step.id : 1;
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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

  useEffect(() => {
    fetchOrder();

    if (!socket) return;

    console.log("Joining order room via global socket:", id);
    joinOrder(id);

    const unsubscribeOrderUpdate = onOrderUpdate((data: { orderId: string; status: string }) => {
      if (data.orderId === id) {
        setOrder(prev => prev ? { ...prev, status: data.status } : null);
        // Re-fetch full order to get updated rider info etc.
        fetchOrder();
      }
    });

    const unsubscribeRiderAssigned = onRiderAssigned((data: { orderId: string; rider: any }) => {
      if (data.orderId === id && data.rider) {
        setOrder(prev => prev ? {
          ...prev,
          deliveryRider: {
            _id: data.rider._id,
            name: data.rider.username || data.rider.name || 'Rider',
            phone: data.rider.phone,
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

      // Auto-redirect to multi-order tracking if this is a sub-order
      if (orderData?.isSubOrder && orderData?.multiOrder) {
        const mid = typeof orderData.multiOrder === 'string'
          ? orderData.multiOrder
          : orderData.multiOrder._id;

        console.log(`Redirecting sub-order ${id} to parent multi-order tracking ${mid}`);
        router.push(`/multi-order-tracking/${mid}`);
        return;
      }

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

  const currentStep = getStepNumber(order.status);
  const isCancellable = order.status === "pending" && (timeLeft !== null && timeLeft > 0);

  // Calculate estimated time
  const getEstimatedTime = () => {
    if (order.estimatedDeliveryTime) {
      const now = new Date();
      const est = new Date(order.estimatedDeliveryTime);
      const diff = Math.max(0, Math.round((est.getTime() - now.getTime()) / 60000));
      return `${diff} min`;
    }
    return "30-45 min";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600 text-sm">From {order.restaurant.name}</p>
            </div>
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{getEstimatedTime()}</span>
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

          {/* Progress Steps */}
          {order.status !== "cancelled" && (
            <div className="relative">
              <div className="flex justify-between mb-2">
                {statusSteps.slice(0, 5).map((step) => (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${step.id <= currentStep
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-500"
                        }`}
                    >
                      {step.id < currentStep ? (
                        <span>&#10003;</span>
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center ${step.id <= currentStep
                          ? "text-red-500 font-medium"
                          : "text-gray-500"
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0" style={{ marginLeft: '5%', marginRight: '5%' }}>
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((currentStep - 1) / 4) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rider Info */}
          {order.deliveryRider && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Delivery Partner</h2>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                  <Image
                    src="/rider-placeholder.jpg"
                    alt={order.deliveryRider.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{order.deliveryRider.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-yellow-500">&#9733;</span>
                    <span>4.8 Rating</span>
                  </div>
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

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Delivery Address</h2>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delivery Location</h3>
                <p className="text-gray-600">
                  {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
                </p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Live Map Tracking</span>
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
                    <h3 className="font-medium text-gray-800 mb-3">Delivery - {order.deliveryRider.name}</h3>
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
          recipientName={chatRecipient === 'rider' ? (order.deliveryRider?.name || 'Rider') : order.restaurant.name}
          recipientRole={chatRecipient === 'rider' ? 'delivery_staff' : 'restaurant'}
          chatThread={chatRecipient === 'rider' ? 'customer-rider' : 'customer-restaurant'}
          onClose={() => setChatRecipient(null)}
        />
      )}
    </div>
  );
}
