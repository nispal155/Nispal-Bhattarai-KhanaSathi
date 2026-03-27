export type TrackingStatus = "confirmed" | "preparing" | "picked_up" | "on_the_way" | "delivered";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type RiderLocationPoint = Coordinate & {
  timestamp?: string;
  source: "live" | "history" | "demo";
};

export type TrackingAddress = {
  addressLine1?: string;
  city?: string;
  state?: string;
  coordinates?: {
    lat?: number | null;
    lng?: number | null;
  };
};

export type TrackableOrderLike = {
  _id: string;
  status: string;
  estimatedDeliveryTime?: string | Date | null;
  restaurant?: {
    name?: string;
    address?: TrackingAddress;
  };
  deliveryAddress?: TrackingAddress;
  riderLocationHistory?: Array<{
    lat?: number | null;
    lng?: number | null;
    timestamp?: string | Date;
  }>;
};

export type LiveTrackingState = {
  orderId: string;
  rawStatus: string;
  status: TrackingStatus;
  etaMinutes: number | null;
  isDemoMode: boolean;
  riderLocation: RiderLocationPoint | null;
  destinationLocation: Coordinate | null;
  restaurantLocation: Coordinate | null;
  locationHistory: RiderLocationPoint[];
  routePoints: Coordinate[];
  canTrackLive: boolean;
  lastUpdatedLabel: string | null;
};

export const TRACKING_TIMELINE_STEPS: Array<{
  status: TrackingStatus;
  label: string;
  description: string;
}> = [
  {
    status: "confirmed",
    label: "Order Confirmed",
    description: "The restaurant has accepted your order.",
  },
  {
    status: "preparing",
    label: "Preparing",
    description: "Your food is being cooked and packed.",
  },
  {
    status: "picked_up",
    label: "Picked Up",
    description: "The rider has collected your order.",
  },
  {
    status: "on_the_way",
    label: "On the Way",
    description: "The rider is heading to your address.",
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Your order has arrived.",
  },
];

export const normalizeTrackingStatus = (status?: string | null): TrackingStatus => {
  switch (status) {
    case "delivered":
      return "delivered";
    case "on_the_way":
      return "on_the_way";
    case "picked_up":
      return "picked_up";
    case "ready":
    case "preparing":
      return "preparing";
    case "pending":
    case "confirmed":
    case "cancelled":
    default:
      return "confirmed";
  }
};

export const formatRawStatus = (status?: string | null) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const isTrackableMovementStatus = (status?: string | null) =>
  status === "picked_up" || status === "on_the_way";
