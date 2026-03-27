"use client";

import { Clock3, LocateFixed, MapPin, PackageCheck } from "lucide-react";
import type { LiveTrackingState } from "@/lib/tracking/trackingTypes";
import { TRACKING_TIMELINE_STEPS, formatRawStatus } from "@/lib/tracking/trackingTypes";

type TrackingStatusPanelProps = {
  tracking: LiveTrackingState;
  restaurantName: string;
  destinationText: string;
};

const getTimelineIndex = (tracking: LiveTrackingState) => {
  if (tracking.rawStatus === "pending") return -1;
  return TRACKING_TIMELINE_STEPS.findIndex((step) => step.status === tracking.status);
};

export default function TrackingStatusPanel({
  tracking,
  restaurantName,
  destinationText,
}: TrackingStatusPanelProps) {
  const currentIndex = getTimelineIndex(tracking);
  const etaLabel =
    tracking.etaMinutes === null
      ? "ETA unavailable"
      : tracking.etaMinutes === 0
        ? "Delivered"
        : `${tracking.etaMinutes} min`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {formatRawStatus(tracking.rawStatus)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tracking.isDemoMode
                  ? "bg-amber-100 text-amber-700"
                  : tracking.canTrackLive
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {tracking.isDemoMode ? "Demo movement" : tracking.canTrackLive ? "Live rider updates" : "Tracking pending"}
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Live delivery tracking</h2>
          <p className="mt-1 text-sm text-gray-500">
            {tracking.rawStatus === "pending"
              ? "The restaurant still needs to confirm your order before live movement begins."
              : "Track the rider location, delivery progress, and estimated arrival in one place."}
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estimated arrival</p>
              <p className="text-2xl font-bold text-gray-900">{etaLabel}</p>
            </div>
          </div>
          {tracking.lastUpdatedLabel && (
            <p className="mt-2 text-xs text-gray-500">{tracking.lastUpdatedLabel}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Pickup point</p>
              <p className="mt-1 text-sm text-gray-600">{restaurantName}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Delivery destination</p>
              <p className="mt-1 text-sm text-gray-600">{destinationText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Delivery progress</p>
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <LocateFixed className="h-4 w-4" />
            {tracking.isDemoMode ? "Simulated rider route" : "Real-time status feed"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {TRACKING_TIMELINE_STEPS.map((step, index) => {
            const isCompleted = currentIndex >= index;
            const isCurrent = currentIndex === index;

            return (
              <div key={step.status} className="relative">
                {index < TRACKING_TIMELINE_STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+1.25rem)] top-5 hidden h-0.5 w-[calc(100%-2rem)] bg-gray-200 md:block">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    />
                  </div>
                )}

                <div className="relative rounded-2xl border border-gray-100 bg-white p-4 text-center">
                  <div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      isCompleted ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${isCurrent ? "text-red-600" : "text-gray-900"}`}>
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
