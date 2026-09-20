'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { HotelCard, type HotelCardData } from '@/components/hotel-card';
import { TEMPLE_DISTANCE_BANDS } from '@gsv/types';

type Filters = {
  q: string; band: string; minPrice: string; maxPrice: string; minRating: string;
  amenities: string[]; ac: boolean; sort: string;
};

const AMENITY_CHIPS = [
  { key: 'ac', label: 'AC' }, { key: 'wifi', label: 'Wi-Fi' }, { key: 'parking', label: 'Parking' },
  { key: 'breakfast', label: 'Breakfast' }, { key: 'family_rooms', label: 'Family Rooms' },
  { key: 'lift', label: 'Lift' }, { key: 'couple_friendly', label: 'Couple Friendly' },
  { key: 'veg_food', label: 'Veg Food' }, { key: 'temple_view', label: 'Temple View' },
];

function Results() {
  const params = useSearchParams();
  const [hotels, setHotels] = useState<HotelCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    q: params.get('q') ?? '', band: params.get('band') ?? '',
    minPrice: '', maxPrice: '', minRating: '',
    amenities: params.get('amenities')?.split(',').filter(Boolean) ?? [],
    ac: params.get('ac') === '1', sort: 'recommended',
  });

  useEffect(() => {
    const p = new URLSearchParams();
    const checkIn = params.get('checkIn'); const checkOut = params.get('checkOut');
    const guests = params.get('guests'); const rooms = params.get('rooms');
    if (checkIn) p.set('checkIn', checkIn);
    if (checkOut) p.set('checkOut', checkOut);
    if (guests) p.set('guests', guests);
    if (rooms) p.set('rooms', rooms);
    if (filters.q) p.set('q', filters.q);
    if (filters.band) p.set('band', filters.band);
    if (filters.minPrice) p.set('minPrice', filters.minPrice);
    if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
    if (filters.minRating) p.set('minRating', filters.minRating);
    if (filters.amenities.length) p.set('amenities', filters.amenities.join(','));
    if (filters.ac) p.set('ac', '1');
    if (filters.sort) p.set('sort', filters.sort);

    setLoading(true);
    api.get<{ hotels: HotelCardData[]; total: number }>(`/api/hotels?${p.toString()}`)
      .then((r) => { setHotels(r.hotels); setTotal(r.total); })
      .catch(() => { setHotels([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [filters, params]);

  function toggleAmenity(key: string) {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(key) ? f.amenities.filter((a) => a !== key) : [...f.amenities, key],
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-temple-700">
        Hotels near Guruvayoor Temple <span className="text-sm font-normal text-temple-400">({total} found)</span>
      </h1>

      {/* Filters */}
      <div className="card mt-4 space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Distance from Temple</label>
            <select className="input" value={filters.band} onChange={(e) => setFilters({ ...filters, band: e.target.value })}>
              <option value="">Any distance</option>
              {TEMPLE_DISTANCE_BANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max budget (₹)</label>
            <input className="input" type="number" min={0} placeholder="e.g. 3000"
              value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
          </div>
          <div>
            <label className="label">Min rating</label>
            <select className="input" value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}>
              <option value="">Any</option>
              <option value="3">3.0+</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
          <div>
            <label className="label">Sort by</label>
            <select className="input" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="recommended">Recommended</option>
              <option value="nearest">🛕 Nearest to Temple</option>
              <option value="price_asc">Price: low → high</option>
              <option value="price_desc">Price: high → low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {AMENITY_CHIPS.map((a) => (
            <button
              key={a.key}
              onClick={() => toggleAmenity(a.key)}
              className={`badge border ${filters.amenities.includes(a.key) || (a.key === 'ac' && filters.ac)
                ? 'border-temple-600 bg-temple-600 text-white'
                : 'border-temple-200 bg-white text-temple-600 hover:border-temple-400'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-80 animate-pulse bg-temple-50" />)}
        </div>
      ) : hotels.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <div className="text-4xl">🛕</div>
          <h2 className="mt-3 font-display text-xl font-bold text-temple-700">No hotels match your filters</h2>
          <p className="mt-1 text-sm text-temple-500">
            Try widening the distance band or removing a filter — new verified stays are added regularly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
        </div>
      )}
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-temple-400">Loading stays…</div>}>
      <Results />
    </Suspense>
  );
}
