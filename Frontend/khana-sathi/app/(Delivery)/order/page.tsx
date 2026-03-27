"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  Package,
  Banknote,
  Navigation,
  CheckCircle,
  Loader2,
  LocateFixed,
  MessageSquare,
  Route
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import ChatWindow from "@/components/Chat/ChatWindow";
import { useRiderLiveLocationPublisher } from "@/hooks/tracking/useRiderLiveLocationPublisher";
import {
  getRiderOrders,
  updateDeliveryStatus,
  type Order
} from "@/lib/orderService";

type ChatTarget = {
  orderId: string;
  recipientName: string;
} | null;

type LocationState = {
  lat: number;
  lng: number;
} | null;

type AddressLike = {
  addressLine1?: string;
  city?: string;
  state?: string;
};

export default function ActiveDeliveries() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { onOrderUpdate, onRiderAssigned } = useSocket();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationState>(null);
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [chatTarget, setChatTarget] = useState<ChatTarget>(null);
  const { isPublishing, locationWarning, publishedLocation } = useRiderLiveLocationPublisher(deliveries);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    void loadDeliveries();
    void refreshCurrentLocation();

    const unsubscribeRider = onRiderAssigned(() => {
      void loadDeliveries();
    });

    const unsubscribeOrder = onOrderUpdate(() => {
      void loadDeliveries();
    });

    return () => {
      unsubscribeRider();
      unsubscribeOrder();
    };
  }, [authLoading, user, router, onOrderUpdate, onRiderAssigned]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const response = await getRiderOrders("active");
      const payload = response.data?.data || [];
      setDeliveries(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Failed to load rider orders:", error);
      toast.error("Failed to load active deliveries");
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentLocation = async (): Promise<LocationState> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("GPS is not available on this device.");
      return null;
    }

    setLocating(true);
    const nextLocation = await new Promise<LocationState>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          resolve(location);
        },
        () => {
          toast.error("Could not access current location");
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 120000,
        }
      );
    });
    setLocating(false);
    return nextLocation;
  };

  const formatAddress = (address?: { addressLine1?: string; city?: string; state?: string }) =>
    [address?.addressLine1, address?.city, address?.state].filter(Boolean).join(", ");

  const getPriorityLabel = (status: string) => {
    if (status === "on_the_way") return "Drop-Off Active";
    if (status === "picked_up") return "Deliver Now";
    if (status === "ready") return "Pickup Ready";
    return "Assigned";
  };

  const getPriorityStyles = (status: string) => {
    if (status === "on_the_way") return "border-blue-200 bg-blue-50 text-blue-700";
    if (status === "picked_up") return "border-green-200 bg-green-50 text-green-700";
    if (status === "ready") return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-gray-200 bg-gray-50 text-gray-700";
  };

  const parseEta = (value?: string) => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const diffMinutes = Math.max(0, Math.round((new Date(value).getTime() - Date.now()) / 60000));
    return diffMinutes;
  };

  const distanceKmFromCurrent = useCallback((delivery: Order, location = currentLocation) => {
    const lat = delivery.deliveryAddress?.coordinates?.lat;
    const lng = delivery.deliveryAddress?.coordinates?.lng;

    if (!location || typeof lat !== "number" || typeof lng !== "number") {
      return null;
    }

    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const diffLat = toRadians(lat - location.lat);
    const diffLng = toRadians(lng - location.lng);
    const a =
      Math.sin(diffLat / 2) ** 2 +
      Math.cos(toRadians(location.lat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(diffLng / 2) ** 2;

    return Number((earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  }, [currentLocation]);

  const getOptimizedDeliveries = useCallback((list: Order[], location = currentLocation) => {
    return [...list].sort((first, second) => {
      const statusRank = (status: string) => {
        if (status === "on_the_way") return 0;
        if (status === "picked_up") return 1;
        if (status === "ready") return 2;
        return 3;
      };

      const rankDifference = statusRank(first.status) - statusRank(second.status);
      if (rankDifference !== 0) return rankDifference;

      const firstDistance = distanceKmFromCurrent(first, location);
      const secondDistance = distanceKmFromCurrent(second, location);

      if (firstDistance !== null && secondDistance !== null && firstDistance !== secondDistance) {
        return firstDistance - secondDistance;
      }

      return parseEta(first.estimatedDeliveryTime) - parseEta(second.estimatedDeliveryTime);
    });
  }, [currentLocation, distanceKmFromCurrent]);

  const optimizedDeliveries = useMemo(() => {
    return getOptimizedDeliveries(deliveries, currentLocation);
  }, [deliveries, currentLocation, getOptimizedDeliveries]);

  const handleOptimizeRoute = async () => {
    const location = currentLocation || await refreshCurrentLocation();

    toast.success("Route reordered. Open Google Maps for live traffic-aware navigation.");
    setDeliveries(getOptimizedDeliveries(deliveries, location));
  };

  const openNavigation = (delivery: Order) => {
    const restaurantAddress = formatAddress(delivery.restaurant?.address as AddressLike | undefined);
    const customerAddress = formatAddress(delivery.deliveryAddress);
    const origin = currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : undefined;
    const includePickupStop = !["picked_up", "on_the_way"].includes(delivery.status) && restaurantAddress;

    if (!customerAddress && !restaurantAddress) {
      toast.error("This order does not have a mappable address yet.");
      return;
    }

    const params = new URLSearchParams();
    params.set("api", "1");
    params.set("travelmode", "driving");
    params.set("destination", customerAddress || restaurantAddress || "");
    if (origin) params.set("origin", origin);
    if (includePickupStop) params.set("waypoints", restaurantAddress);

    const url = `https://www.google.com/maps/dir/?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMarkOnTheWay = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      await updateDeliveryStatus(orderId, "on_the_way");
      toast.success("Delivery marked as on the way");
      await loadDeliveries();
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      toast.error("Could not update delivery status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setUpdatingId(orderId);
      await updateDeliveryStatus(orderId, "delivered");
      toast.success("Delivery marked as delivered");
      await loadDeliveries();
    } catch (error) {
      console.error("Failed to mark delivery complete:", error);
      toast.error("Could not complete delivery");
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10">
              <Image src="/logo.png" alt="KhanaSathi" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Route Console</h1>
              <p className="text-sm text-gray-500">Fastest routes open in Google Maps with live traffic guidance.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void refreshCurrentLocation()}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
              Refresh GPS
            </button>
            <button
              onClick={() => void handleOptimizeRoute()}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600"
            >
              <Route className="h-4 w-4" />
              Optimize Route
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600">Live routing support</p>
              <p className="text-sm text-gray-600">
                Current location is {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : "not locked yet"}.
                Route order prefers active drop-offs first, then nearest known stops.
              </p>
              {locationWarning ? (
                <p className="mt-2 text-sm font-medium text-amber-700">{locationWarning}</p>
              ) : isPublishing ? (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Live rider tracking is publishing in the background{publishedLocation ? ` from ${publishedLocation.lat.toFixed(4)}, ${publishedLocation.lng.toFixed(4)}` : ""}.
                </p>
              ) : (
                <p className="mt-2 text-sm font-medium text-gray-500">
                  Live tracking begins automatically once a delivery is picked up.
                </p>
              )}
            </div>
            <p className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
              Active deliveries: {optimizedDeliveries.length}
            </p>
          </div>
        </div>

        {optimizedDeliveries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 text-lg font-semibold text-gray-600">No active deliveries right now</p>
            <p className="mt-2 text-sm text-gray-400">New assigned orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {optimizedDeliveries.map((delivery) => {
              const dropDistance = distanceKmFromCurrent(delivery);
              const etaMinutes = parseEta(delivery.estimatedDeliveryTime);
              const restaurantAddress = formatAddress(delivery.restaurant?.address as AddressLike | undefined);
              const customerAddress = formatAddress(delivery.deliveryAddress);

              return (
                <div key={delivery._id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-8">
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold text-gray-900">Order #{delivery.orderNumber}</h3>
                          <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${getPriorityStyles(delivery.status)}`}>
                            {getPriorityLabel(delivery.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {delivery.restaurant?.name} • Customer: {delivery.customer?.username || "Customer"}
                        </p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-sm text-gray-500">Estimated remaining</p>
                        <p className="text-2xl font-bold text-gray-900">{etaMinutes === Number.MAX_SAFE_INTEGER ? "Unknown" : `${etaMinutes} min`}</p>
                      </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <MapPin className="mt-1 h-6 w-6 text-red-500" />
                          <div>
                            <p className="text-sm text-gray-500">Pickup Stop</p>
                            <p className="font-medium text-gray-900">{restaurantAddress || "Restaurant address unavailable"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Package className="mt-1 h-6 w-6 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Items</p>
                            <p className="font-medium text-gray-900">
                              {delivery.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Banknote className="mt-1 h-6 w-6 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-500">Order Total</p>
                            <p className="font-medium text-gray-900">Rs. {delivery.pricing?.total || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <MapPin className="mt-1 h-6 w-6 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500">Drop-Off Stop</p>
                            <p className="font-medium text-gray-900">{customerAddress || "Delivery address unavailable"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Clock className="mt-1 h-6 w-6 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Distance from current GPS</p>
                            <p className="font-medium text-gray-900">{dropDistance === null ? "Unknown" : `${dropDistance} km`}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Navigation className="mt-1 h-6 w-6 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Navigation mode</p>
                            <p className="font-medium text-gray-900">Google Maps live traffic routing</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setChatTarget({ orderId: delivery._id, recipientName: delivery.customer?.username || "Customer" })}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
                      >
                        <MessageSquare className="h-5 w-5" />
                        Chat
                      </button>
                      <button
                        onClick={() => openNavigation(delivery)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
                      >
                        <Navigation className="h-5 w-5" />
                        Navigate
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {delivery.status === "picked_up" && (
                        <button
                          onClick={() => void handleMarkOnTheWay(delivery._id)}
                          disabled={updatingId === delivery._id}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
                        >
                          {updatingId === delivery._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
                          Start Delivery
                        </button>
                      )}
                      {delivery.status === "on_the_way" && (
                        <button
                          onClick={() => void handleMarkDelivered(delivery._id)}
                          disabled={updatingId === delivery._id}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                          {updatingId === delivery._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {chatTarget && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
          <ChatWindow
            orderId={chatTarget.orderId}
            recipientName={chatTarget.recipientName}
            recipientRole="customer"
            chatThread="customer-rider"
            onClose={() => setChatTarget(null)}
          />
        </div>
      )}
    </div>
  );
}
