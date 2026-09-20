'use client';

import { useParams } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { HotelCard, type HotelCardData } from '@/components/hotel-card';

const COLLECTIONS: Record<string, { title: string; blurb: string; query: string }> = {
  pilgrims: { title: 'Hotels for Pilgrims', blurb: 'Early-darshan friendly stays with hot water, veg food and temple proximity.', query: 'sort=nearest&amenities=hot_water,drinking_water' },
  families: { title: 'Hotels for Families', blurb: 'Spacious family rooms, safe premises and home-style food.', query: 'amenities=family_rooms' },
  budget: { title: 'Budget Hotels', blurb: 'Clean, honest rooms under ₹1,500 a night.', query: 'maxPrice=1500&sort=price_asc' },
  ac: { title: 'AC Rooms', blurb: 'Air-conditioned comfort after a hot temple day.', query: 'ac=1' },
  parking: { title: 'Hotels with Parking', blurb: 'Arriving by car or bike? Park safely at these stays.', query: 'amenities=parking' },
  couples: { title: 'Couple Friendly', blurb: 'Verified stays that welcome couples.', query: 'amenities=couple_friendly' },
  temple: { title: 'Hotels Near Guruvayoor Temple', blurb: 'The closest stays to the East Nada — walk to darshan.', query: 'band=u500' },
};

function CollectionList() {
  const { key } = useParams<{ key: string }>();
  const meta = COLLECTIONS[key] ?? COLLECTIONS['pilgrims']!;
  const params = useSearchParams();
  const [hotels, setHotels] = useState<HotelCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIn = params.get('checkIn'); const checkOut = params.get('checkOut');
    const extra = new URLSearchParams();
    if (checkIn) extra.set('checkIn', checkIn);
    if (checkOut) extra.set('checkOut', checkOut);
    setLoading(true);
    api.get<{ hotels: HotelCardData[] }>(`/api/hotels?${meta.query}&${extra.toString()}`)
      .then((r) => setHotels(r.hotels))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [meta.query, params]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-temple-700">{meta.title}</h1>
      <p className="mt-1 text-temple-500">{meta.blurb}</p>
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-80 animate-pulse bg-temple-50" />)}
        </div>
      ) : hotels.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-temple-500">
          🛕 No stays match this collection right now — check back soon.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-temple-400">Loading…</div>}>
      <CollectionList />
    </Suspense>
  );
}
