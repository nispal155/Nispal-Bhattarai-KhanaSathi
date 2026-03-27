"use client";

import L from "leaflet";

const createMarker = (emoji: string, color: string) =>
  L.divIcon({
    className: "",
    iconAnchor: [18, 18],
    iconSize: [36, 36],
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 9999px;
        background: ${color};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.28);
        font-size: 16px;
      ">
        ${emoji}
      </div>
    `,
  });

export const riderMarkerIcon = createMarker("R", "#2563eb");
export const destinationMarkerIcon = createMarker("C", "#dc2626");
export const restaurantMarkerIcon = createMarker("S", "#f59e0b");
