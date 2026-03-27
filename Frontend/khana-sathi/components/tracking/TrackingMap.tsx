"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LiveTrackingState } from "@/lib/tracking/trackingTypes";
import { destinationMarkerIcon, restaurantMarkerIcon, riderMarkerIcon } from "@/lib/tracking/leafletIcons";

type TrackingMapProps = {
  tracking: LiveTrackingState;
  destinationLabel: string;
  restaurantLabel?: string;
};

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

function FitBounds({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    map.fitBounds(positions, {
      padding: [40, 40],
    });
  }, [map, positions]);

  return null;
}

export default function TrackingMap({ tracking, destinationLabel, restaurantLabel }: TrackingMapProps) {
  const positions = [
    tracking.restaurantLocation ? [tracking.restaurantLocation.lat, tracking.restaurantLocation.lng] as [number, number] : null,
    tracking.riderLocation ? [tracking.riderLocation.lat, tracking.riderLocation.lng] as [number, number] : null,
    tracking.destinationLocation ? [tracking.destinationLocation.lat, tracking.destinationLocation.lng] as [number, number] : null,
  ].filter((point): point is [number, number] => Boolean(point));

  if (positions.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
        <div className="max-w-sm px-6">
          <p className="text-base font-semibold text-gray-700">Map coordinates are not available yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Live tracking will appear here when the order has saved delivery coordinates.
          </p>
        </div>
      </div>
    );
  }

  const initialCenter = positions[0] || DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Live order map</p>
          <p className="text-xs text-gray-500">
            {tracking.isDemoMode ? "Demo route simulation is active." : "OpenStreetMap live rider view"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tracking.isDemoMode
              ? "bg-amber-100 text-amber-700"
              : tracking.canTrackLive
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {tracking.isDemoMode ? "Demo mode" : tracking.canTrackLive ? "Live tracking" : "Status preview"}
        </span>
      </div>

      <div className="h-[320px]">
        <MapContainer center={initialCenter} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />

          {tracking.restaurantLocation && (
            <Marker
              icon={restaurantMarkerIcon}
              position={[tracking.restaurantLocation.lat, tracking.restaurantLocation.lng]}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                {restaurantLabel || "Restaurant"}
              </Tooltip>
            </Marker>
          )}

          {tracking.riderLocation && (
            <Marker icon={riderMarkerIcon} position={[tracking.riderLocation.lat, tracking.riderLocation.lng]}>
              <Tooltip direction="top" offset={[0, -16]}>
                {tracking.isDemoMode ? "Demo rider" : "Delivery rider"}
              </Tooltip>
            </Marker>
          )}

          {tracking.destinationLocation && (
            <Marker
              icon={destinationMarkerIcon}
              position={[tracking.destinationLocation.lat, tracking.destinationLocation.lng]}
            >
              <Tooltip direction="top" offset={[0, -16]}>
                {destinationLabel}
              </Tooltip>
            </Marker>
          )}

          {tracking.routePoints.length >= 2 && (
            <Polyline
              pathOptions={{
                color: tracking.isDemoMode ? "#f59e0b" : "#2563eb",
                dashArray: tracking.isDemoMode ? "10 6" : undefined,
                weight: 4,
              }}
              positions={tracking.routePoints.map((point) => [point.lat, point.lng])}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
