"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { updateRiderLocation } from "@/lib/orderService";
import { haversineDistanceMeters } from "@/lib/tracking/demoRoute";
import type { Coordinate } from "@/lib/tracking/trackingTypes";

type TrackableOrderInput = {
  _id: string;
  status: string;
};

const PUBLISHABLE_STATUSES = new Set(["picked_up", "on_the_way"]);
const PUBLISH_INTERVAL_MS = 10000;
const MIN_MOVEMENT_METERS = 15;

export function useRiderLiveLocationPublisher(orders: TrackableOrderInput[]) {
  const { emitRiderLocation } = useSocket();
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [publishedLocation, setPublishedLocation] = useState<Coordinate | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const activeOrdersRef = useRef<TrackableOrderInput[]>([]);
  const lastPublishRef = useRef<{
    location: Coordinate;
    timestamp: number;
  } | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((order) => PUBLISHABLE_STATUSES.has(order.status)),
    [orders]
  );

  const activeOrderSignature = useMemo(
    () => activeOrders.map((order) => `${order._id}:${order.status}`).join("|"),
    [activeOrders]
  );

  useEffect(() => {
    activeOrdersRef.current = activeOrders;
  }, [activeOrders]);

  useEffect(() => {
    const clearTracking = () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = null;
      lastPublishRef.current = null;
    };

    if (typeof window === "undefined") return;

    if (activeOrders.length === 0) {
      clearTracking();
      return;
    }

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setLocationWarning("Live rider tracking needs GPS support on this device.");
      });
      clearTracking();
      return;
    }

    queueMicrotask(() => {
      setLocationWarning(null);
    });

    // One watcher is shared across all active rider orders on the page.
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const now = Date.now();
        const lastPublish = lastPublishRef.current;

        if (lastPublish && now - lastPublish.timestamp < PUBLISH_INTERVAL_MS) {
          return;
        }

        if (lastPublish && haversineDistanceMeters(lastPublish.location, location) < MIN_MOVEMENT_METERS) {
          return;
        }

        lastPublishRef.current = {
          location,
          timestamp: now,
        };
        setPublishedLocation(location);

        const trackableOrders = activeOrdersRef.current;
        await Promise.allSettled(
          trackableOrders.map(async (order) => {
            emitRiderLocation(order._id, location.lat, location.lng);
            const response = await updateRiderLocation(order._id, location.lat, location.lng);
            if (response.error) {
              console.warn(`Failed to persist rider location for order ${order._id}:`, response.error);
            }
          })
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationWarning("GPS permission is disabled, so live customer tracking is paused.");
        } else {
          setLocationWarning("Could not read the rider location for live tracking.");
        }
        clearTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    return clearTracking;
  }, [activeOrders.length, activeOrderSignature, emitRiderLocation]);

  return {
    isPublishing: activeOrders.length > 0 && !locationWarning,
    locationWarning: activeOrders.length > 0 ? locationWarning : null,
    publishedLocation,
  };
}
