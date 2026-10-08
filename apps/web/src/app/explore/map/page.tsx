'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapMarkerData } from '@/components/namma-map';
import { Map, MapPin, Filter, Search } from 'lucide-react';

// Load NammaMap dynamically so it only runs on the client and doesn't break SSR
const NammaMap = dynamic(() => import('@/components/namma-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-temple-50 flex items-center justify-center border-2 border-dashed border-temple-200">
      <div className="animate-pulse text-temple-400 font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5 animate-bounce" /> Loading Map...
      </div>
    </div>
  )
});

// Mocked data for the map ecosystem
const MOCK_MARKERS: MapMarkerData[] = [
  { id: 'h1', lat: 10.5960, lng: 76.2085, type: 'HOTEL', title: 'Srivari Residency', subtitle: '350m from Temple • AC Rooms' },
  { id: 'h2', lat: 10.5930, lng: 76.2060, type: 'HOTEL', title: 'Gokulam Sabari', subtitle: '250m from Temple • Premium' },
  { id: 'd1', lat: 10.5955, lng: 76.2090, type: 'DRIVER', title: 'Suresh Menon', subtitle: 'Auto • KL 46 AB 1234' },
  { id: 'd2', lat: 10.5910, lng: 76.2045, type: 'DRIVER', title: 'Rahul K.', subtitle: 'Taxi (Innova) • 4.9★' },
  { id: 'r1', lat: 10.5948, lng: 76.2082, type: 'RESTAURANT', title: 'Saravana Bhavan', subtitle: 'Pure Veg • South Indian' },
  { id: 'r2', lat: 10.5952, lng: 76.2070, type: 'RESTAURANT', title: 'Anand Vihar', subtitle: 'Pure Veg • Meals' },
  { id: 'm1', lat: 10.5925, lng: 76.2055, type: 'HOSPITAL', title: 'Rajah Hospital', subtitle: '24/7 Emergency Care' },
];

export default function ExploreMapPage() {
  const [filter, setFilter] = useState<'ALL' | 'HOTEL' | 'DRIVER' | 'RESTAURANT' | 'HOSPITAL'>('ALL');

  const filteredMarkers = useMemo(() => {
    if (filter === 'ALL') return MOCK_MARKERS;
    return MOCK_MARKERS.filter(m => m.type === filter);
  }, [filter]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Mobile-friendly map header/filters */}
      <div className="bg-white border-b border-temple-100 p-4 shadow-sm z-10 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <Map className="w-6 h-6 text-gold-600" />
            <h1 className="font-display font-bold text-xl text-temple-900">Namma Map</h1>
          </div>
          
          <div className="flex w-full md:w-auto overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide">
            <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-gold-500 text-white border-gold-600 shadow' : 'bg-white text-temple-700 border-temple-200 hover:bg-temple-50'}`}>All</button>
            <button onClick={() => setFilter('HOTEL')} className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'HOTEL' ? 'bg-blue-600 text-white border-blue-700 shadow' : 'bg-white text-temple-700 border-temple-200 hover:bg-temple-50'}`}>🏨 Hotels</button>
            <button onClick={() => setFilter('DRIVER')} className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'DRIVER' ? 'bg-yellow-500 text-white border-yellow-600 shadow' : 'bg-white text-temple-700 border-temple-200 hover:bg-temple-50'}`}>🚕 Rides</button>
            <button onClick={() => setFilter('RESTAURANT')} className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'RESTAURANT' ? 'bg-rose-600 text-white border-rose-700 shadow' : 'bg-white text-temple-700 border-temple-200 hover:bg-temple-50'}`}>🍛 Food</button>
            <button onClick={() => setFilter('HOSPITAL')} className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${filter === 'HOSPITAL' ? 'bg-green-600 text-white border-green-700 shadow' : 'bg-white text-temple-700 border-temple-200 hover:bg-temple-50'}`}>🏥 Hospitals</button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-temple-50">
        <NammaMap markers={filteredMarkers} />

        {/* Floating search/summary widget over map */}
        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white rounded-xl shadow-2xl border border-temple-100 overflow-hidden z-[400]">
          <div className="p-4 border-b border-temple-100 bg-temple-50">
            <h3 className="font-bold text-temple-900">Map Summary</h3>
            <p className="text-xs text-temple-500">Showing {filteredMarkers.length} locations around Guruvayoor.</p>
          </div>
          <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
            {filteredMarkers.map(m => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-temple-50 last:border-0 cursor-pointer hover:bg-temple-50 px-2 -mx-2 rounded">
                <div>
                  <div className="font-semibold text-sm text-temple-800">{m.title}</div>
                  <div className="text-xs text-temple-500">{m.subtitle}</div>
                </div>
                <div className="text-lg">
                  {m.type === 'HOTEL' && '🏨'}
                  {m.type === 'DRIVER' && '🚕'}
                  {m.type === 'RESTAURANT' && '🍛'}
                  {m.type === 'HOSPITAL' && '🏥'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
