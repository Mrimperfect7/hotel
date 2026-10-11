'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  MapPin,
  Calendar,
  Compass,
  Phone,
  ArrowRight,
  LifeBuoy,
  PlusCircle,
  Share2
} from 'lucide-react';

type TripItem = {
  id: string;
  type: string;
  dateTime: string;
  title: string;
  subtitle: string;
  entityId?: string;
};

type TripData = {
  id: string;
  name: string;
  tripCode?: string;
  items: TripItem[];
};

function CustomerTripContent() {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: TripData }>('/api/trips/me', true)
      .then((res) => setTrip(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  const items = trip?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-gold-600" /> My Guruvayoor Itinerary & Trip
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Complete schedule of temple darshans, hotel check-ins, guide meets, and taxi rides.
          </p>
        </div>
        {trip?.tripCode && (
          <div className="badge bg-gold-100 text-gold-800 border border-gold-200 font-mono text-xs px-3 py-1.5 font-bold">
            Trip ID: {trip.tripCode}
          </div>
        )}
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="card p-12 text-center text-temple-400">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-semibold text-temple-700 text-base">Your Guruvayoor trip timeline is currently empty.</p>
          <p className="text-xs text-temple-400 mt-1 max-w-md mx-auto">
            Book hotels, taxis, darshan guides, or sadhya deliveries to automatically construct your personal spiritual schedule.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/plan-trip" className="btn-gold text-xs py-2 px-4 font-bold">
              Plan Full Trip Automatically 🛕
            </Link>
            <Link href="/hotels" className="btn-outline text-xs py-2 px-4">
              Browse Stays
            </Link>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:h-full before:w-0.5 before:bg-temple-200">
            {items.map((item) => (
              <div key={item.id} className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white bg-temple-100 text-temple-700 shadow-md shrink-0 z-10 text-lg">
                  {item.type === 'HOTEL' && '🏨'}
                  {item.type === 'GUIDE' && '🧑‍🏫'}
                  {item.type === 'RIDE' && '🚕'}
                  {item.type === 'FOOD' && '🍛'}
                </div>
                <div className="flex-1 card p-4 bg-white border border-temple-100 shadow-sm">
                  <div className="text-xs text-gold-600 font-semibold mb-1">
                    {new Date(item.dateTime).toLocaleString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <h3 className="font-bold text-temple-800 text-base">{item.title}</h3>
                  <p className="text-xs text-temple-500 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Services to Trip */}
      <div className="card p-6">
        <h2 className="font-bold text-temple-800 text-base mb-4">Add More Services to Trip</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/rides" className="p-3 bg-temple-50 rounded-xl hover:bg-temple-100 transition flex items-center gap-2.5">
            <span className="text-2xl">🚕</span>
            <div>
              <p className="text-xs font-bold text-temple-800">Add Taxi</p>
              <p className="text-[10px] text-temple-400">Station / Temple</p>
            </div>
          </Link>
          <Link href="/guides" className="p-3 bg-temple-50 rounded-xl hover:bg-temple-100 transition flex items-center gap-2.5">
            <span className="text-2xl">🧑‍🏫</span>
            <div>
              <p className="text-xs font-bold text-temple-800">Add Guide</p>
              <p className="text-[10px] text-temple-400">Darshan rituals</p>
            </div>
          </Link>
          <Link href="/food" className="p-3 bg-temple-50 rounded-xl hover:bg-temple-100 transition flex items-center gap-2.5">
            <span className="text-2xl">🍛</span>
            <div>
              <p className="text-xs font-bold text-temple-800">Add Food</p>
              <p className="text-[10px] text-temple-400">Pure veg sadhya</p>
            </div>
          </Link>
          <Link href="/support" className="p-3 bg-red-50 rounded-xl hover:bg-red-100 transition flex items-center gap-2.5">
            <span className="text-2xl">🆘</span>
            <div>
              <p className="text-xs font-bold text-red-700">Pilgrim SOS</p>
              <p className="text-[10px] text-red-500">24/7 Assistance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerTripPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <CustomerTripContent />
    </Suspense>
  );
}
