import type { Coordinate, RiderLocationPoint, TrackingStatus } from "./trackingTypes";

export const toCoordinate = (
  coordinates?: {
    lat?: number | null;
    lng?: number | null;
  } | null
): Coordinate | null => {
  const lat = coordinates?.lat;
  const lng = coordinates?.lng;

  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
};

export const haversineDistanceMeters = (first: Coordinate, second: Coordinate) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(second.lat - first.lat);
  const deltaLng = toRadians(second.lng - first.lng);
  const latOne = toRadians(first.lat);
  const latTwo = toRadians(second.lat);

  const base =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latOne) * Math.cos(latTwo) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(base), Math.sqrt(1 - base));
};

export const movePointTowards = (start: Coordinate, target: Coordinate, fraction = 0.08): Coordinate => ({
  lat: start.lat + (target.lat - start.lat) * fraction,
  lng: start.lng + (target.lng - start.lng) * fraction,
});

export const createOffsetPoint = (target: Coordinate): Coordinate => ({
  lat: target.lat + 0.008,
  lng: target.lng - 0.008,
});

export const createDemoSeedPoint = (options: {
  destination: Coordinate | null;
  latestHistory: RiderLocationPoint | null;
  restaurant: Coordinate | null;
}) => {
  if (options.latestHistory) {
    return {
      lat: options.latestHistory.lat,
      lng: options.latestHistory.lng,
    };
  }

  if (options.restaurant) {
    return options.restaurant;
  }

  if (options.destination) {
    return createOffsetPoint(options.destination);
  }

  return null;
};

export const buildRoutePoints = (options: {
  status: TrackingStatus;
  rider: Coordinate | null;
  destination: Coordinate | null;
  restaurant: Coordinate | null;
}) => {
  if (options.rider && options.destination) {
    return [options.rider, options.destination];
  }

  if (
    options.restaurant &&
    options.destination &&
    options.status !== "picked_up" &&
    options.status !== "on_the_way" &&
    options.status !== "delivered"
  ) {
    return [options.restaurant, options.destination];
  }

  return [];
};

export const formatTimeAgo = (timestamp?: string | null) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return "Updated just now";
  if (diffSeconds < 3600) return `Updated ${Math.floor(diffSeconds / 60)} min ago`;

  return `Updated ${Math.floor(diffSeconds / 3600)} hr ago`;
};
