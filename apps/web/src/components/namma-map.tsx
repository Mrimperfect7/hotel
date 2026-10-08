'use client';

import { useEffect, useRef } from 'react';

// Temple coordinates
const TEMPLE_LAT = 10.5945;
const TEMPLE_LNG = 76.2075;

export interface MapMarkerData {
  id: string;
  lat: number;
  lng: number;
  type: 'HOTEL' | 'DRIVER' | 'RESTAURANT' | 'HOSPITAL';
  title: string;
  subtitle: string;
}

export default function NammaMap({ markers }: { markers: MapMarkerData[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id != null) return;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView([TEMPLE_LAT, TEMPLE_LNG], 15);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Helper function to create custom div icons
      const createIcon = (emoji: string, color: string) => L.divIcon({
        className: '',
        html: `
          <div style="
            background: ${color};
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });

      const icons = {
        HOTEL: createIcon('🏨', '#1e3a5f'),
        DRIVER: createIcon('🚕', '#fbbf24'),
        RESTAURANT: createIcon('🍛', '#e11d48'),
        HOSPITAL: createIcon('🏥', '#16a34a'),
        TEMPLE: createIcon('🛕', '#c8972d')
      };

      // Add Temple marker (Center)
      L.marker([TEMPLE_LAT, TEMPLE_LNG], { icon: icons.TEMPLE, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<strong style="color:#c8972d">Guruvayoor Temple</strong><br/><span style="font-size:11px;color:#666">The Heart of the Town</span>`);

      // Add all dynamic markers
      markers.forEach(m => {
        L.marker([m.lat, m.lng], { icon: icons[m.type] })
          .addTo(map)
          .bindPopup(`<strong>${m.title}</strong><br/><span style="font-size:11px;color:#666">${m.subtitle}</span><br/><button class="mt-2 text-xs bg-temple-100 px-2 py-1 rounded text-temple-800 font-bold border border-temple-200">View Details</button>`);
      });

    });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      <div ref={mapRef} className="h-full w-full z-0" />
    </>
  );
}
