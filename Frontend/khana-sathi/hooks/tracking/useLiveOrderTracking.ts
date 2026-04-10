"use client";

import { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import {
  buildRoutePoints,
  createDemoSeedPoint,
  formatTimeAgo,
  haversineDistanceMeters,
  movePointTowards,
  toCoordinate,
} from "@/lib/tracking/demoRoute";
import type { Coordinate, LiveTrackingState, RiderLocationPoint, TrackableOrderLike } from "@/lib/tracking/trackingTypes";
import { isTrackableMovementStatus, normalizeTrackingStatus } from "@/lib/tracking/trackingTypes";

type UseLiveOrderTrackingOptions = {
  demoMode?: boolean;
};

const getMinutesUntil = (timestamp?: string | Date | null) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  return minutes > 0 ? minutes : null;
};

const estimateMinutesByDistance = (from: Coordinate | null, to: Coordinate | null) => {
  if (!from || !to) return null;

  const distanceMeters = haversineDistanceMeters(from, to);
  const speedMetersPerMinute = (25 * 1000) / 60;
  const minutes = Math.round(distanceMeters / speedMetersPerMinute);

  return Math.max(1, minutes);
};

const normalizeHistory = (history?: TrackableOrderLike["riderLocationHistory"]) =>
  (Array.isArray(history) ? history : [])
    .map((point) => {
      if (typeof point?.lat !== "number" || typeof point?.lng !== "number") {
        return null;
      }

      const normalized: RiderLocationPoint = {
        lat: point.lat,
        lng: point.lng,
        source: "history" as const,
      };
      
      if (point.timestamp) {
        normalized.timestamp = new Date(point.timestamp).toISOString();
      }
      
      return normalized;
    })
    .filter((point): point is RiderLocationPoint => Boolean(point));

export function useLiveOrderTracking(order: TrackableOrderLike | null, options?: UseLiveOrderTrackingOptions): LiveTrackingState {
  const { onRiderLocation } = useSocket();
  const [liveLocationState, setLiveLocationState] = useState<{
    orderId: string;
    point: RiderLocationPoint;
  } | null>(null);
  const [demoLocationState, setDemoLocationState] = useState<{
    orderId: string;
    point: RiderLocationPoint;
  } | null>(null);
  const isDemoMode = Boolean(options?.demoMode);

  const locationHistory = useMemo(() => normalizeHistory(order?.riderLocationHistory), [order?.riderLocationHistory]);
  const latestHistoryLocation = locationHistory[locationHistory.length - 1] || null;
  const destinationLocation = useMemo(() => toCoordinate(order?.deliveryAddress?.coordinates), [order?.deliveryAddress?.coordinates]);
  const restaurantLocation = useMemo(() => toCoordinate(order?.restaurant?.address?.coordinates), [order?.restaurant?.address?.coordinates]);
  const normalizedStatus = normalizeTrackingStatus(order?.status);
  const canTrackLive = Boolean(destinationLocation) && isTrackableMovementStatus(order?.status);
  const liveLocation =
    order?._id && liveLocationState && liveLocationState.orderId === order._id
      ? liveLocationState.point
      : null;
  const freshestLiveLocation = useMemo(() => {
    if (!liveLocation) return latestHistoryLocation;
    if (!latestHistoryLocation) return liveLocation;
    if (!liveLocation.timestamp || !latestHistoryLocation.timestamp) return liveLocation;

    return new Date(latestHistoryLocation.timestamp).getTime() > new Date(liveLocation.timestamp).getTime()
      ? latestHistoryLocation
      : liveLocation;
  }, [latestHistoryLocation, liveLocation]);

  useEffect(() => {
    if (!order?._id || isDemoMode) return;

    return onRiderLocation((data: { orderId?: string; lat?: number; lng?: number }) => {
      if (data.orderId !== order._id || typeof data.lat !== "number" || typeof data.lng !== "number") {
        return;
      }

      setLiveLocationState({
        orderId: order._id,
        point: {
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
          source: "live",
        },
      });
    });
  }, [isDemoMode, onRiderLocation, order?._id]);

  const seededDemoLocation = useMemo(() => {
    if (!isDemoMode || !destinationLocation || !order?._id || !canTrackLive) {
      return null;
    }

    const seedPoint = createDemoSeedPoint({
      destination: destinationLocation,
      latestHistory: freshestLiveLocation,
      restaurant: restaurantLocation,
    });

    if (!seedPoint) {
      return null;
    }

    return {
      lat: seedPoint.lat,
      lng: seedPoint.lng,
      timestamp: new Date().toISOString(),
      source: "demo" as const,
    };
  }, [canTrackLive, destinationLocation, freshestLiveLocation, isDemoMode, order?._id, restaurantLocation]);

  useEffect(() => {
    if (!isDemoMode || !destinationLocation || !order?._id || !canTrackLive || !seededDemoLocation) {
      return;
    }

    const interval = window.setInterval(() => {
      setDemoLocationState((current) => {
        const base =
          current?.orderId === order._id
            ? current.point
            : seededDemoLocation;

        if (haversineDistanceMeters(base, destinationLocation) <= 20) {
          return {
            orderId: order._id,
            point: {
              ...destinationLocation,
              timestamp: new Date().toISOString(),
              source: "demo",
            },
          };
        }

        const moved = movePointTowards(base, destinationLocation, 0.08);
        return {
          orderId: order._id,
          point: {
            ...moved,
            timestamp: new Date().toISOString(),
            source: "demo",
          },
        };
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [canTrackLive, destinationLocation, isDemoMode, order?._id, seededDemoLocation]);

  const demoLocation =
    order?._id && demoLocationState && demoLocationState.orderId === order._id
      ? demoLocationState.point
      : seededDemoLocation;
  const riderLocation = isDemoMode && canTrackLive ? demoLocation : freshestLiveLocation;
  const routePoints = buildRoutePoints({
    status: normalizedStatus,
    rider: riderLocation,
    destination: destinationLocation,
    restaurant: restaurantLocation,
  });

  const etaMinutes = (() => {
    if (order?.status === "delivered") return 0;

    const serverEtaMinutes = getMinutesUntil(order?.estimatedDeliveryTime);
    if (serverEtaMinutes !== null) return serverEtaMinutes;

    return estimateMinutesByDistance(riderLocation, destinationLocation);
  })();

  return {
    orderId: order?._id || "",
    rawStatus: order?.status || "pending",
    status: normalizedStatus,
    etaMinutes,
    isDemoMode,
    riderLocation,
    destinationLocation,
    restaurantLocation,
    locationHistory,
    routePoints,
    canTrackLive,
    lastUpdatedLabel: formatTimeAgo(riderLocation?.timestamp),
  };
}
