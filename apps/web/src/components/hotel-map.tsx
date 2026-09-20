'use client';

import { useEffect, useRef } from 'react';

interface HotelMapProps {
  lat: number;
  lng: number;
  hotelName: string;
}

// Temple coordinates
const TEMPLE_LAT = 10.5945;
const TEMPLE_LNG = 76.2075;

export default function HotelMap({ lat, lng, hotelName }: HotelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;

    // Dynamically import leaflet (client-only)
    import('leaflet').then((L) => {
      // Strict Mode fires effects twice — bail out if cleanup already ran
      if (destroyed || !mapRef.current) return;
      // Bail out if Leaflet already owns this container
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id != null) return;
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([lat, lng], 15);
      mapInstanceRef.current = map;

      // OpenStreetMap tile layer — 100% free, no API key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Hotel marker (blue)
      const hotelIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: #1e3a5f;
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🏨</span>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      // Temple marker (gold)
      const templeIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            background: #c8972d;
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">🛕</span>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      // Add hotel marker
      L.marker([lat, lng], { icon: hotelIcon })
        .addTo(map)
        .bindPopup(
          `<strong style="color:#1e3a5f">${hotelName}</strong><br/><span style="font-size:11px;color:#666">Hotel location</span>`,
          { maxWidth: 200 }
        )
        .openPopup();

      // Add Guruvayoor Temple marker
      L.marker([TEMPLE_LAT, TEMPLE_LNG], { icon: templeIcon })
        .addTo(map)
        .bindPopup(
          `<strong style="color:#c8972d">Guruvayoor Sri Krishna Temple</strong><br/><span style="font-size:11px;color:#666">Reference point</span>`,
          { maxWidth: 220 }
        );

      // Draw a dashed line between hotel and temple
      L.polyline(
        [
          [lat, lng],
          [TEMPLE_LAT, TEMPLE_LNG],
        ],
        { color: '#c8972d', weight: 2, dashArray: '6 6', opacity: 0.7 }
      ).addTo(map);

      // Fit map to show both markers
      map.fitBounds(
        [
          [lat, lng],
          [TEMPLE_LAT, TEMPLE_LNG],
        ],
        { padding: [40, 40] }
      );
    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, hotelName]);

  return (
    <>
      {/* Leaflet CSS — loaded inline so no extra config needed */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={mapRef} className="h-full w-full" />
    </>
  );
}
