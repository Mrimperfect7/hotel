'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

import { useRouter } from 'next/navigation';

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

export default function MyTripPage() {
  const router = useRouter();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { getToken } = require('@/lib/api');
    if (!getToken()) {
      router.push('/login?next=/my-trip');
      return;
    }
    
    api.get<{ data: TripData }>('/api/trips/me', true)
      .then(res => setTrip(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-temple-50/50 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-temple-800">
              {trip?.name || 'My Guruvayoor Trip'}
            </h1>
            {trip?.tripCode && (
              <div className="mt-2 inline-block rounded bg-gold-100 px-3 py-1 text-sm font-semibold text-gold-800 border border-gold-200">
                Trip ID: {trip.tripCode}
              </div>
            )}
          </div>
          
          {loading ? (
            <p className="text-center text-temple-500">Loading your trip...</p>
          ) : trip?.items.length === 0 ? (
            <div className="card p-8 text-center bg-white border border-temple-100">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-temple-600">Your trip timeline is empty.</p>
              <p className="text-sm text-temple-400 mt-1">Book hotels, guides, or rides to see them here.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-temple-200 before:to-transparent">
              {trip?.items.map(item => {
                let linkHref = '#';
                if (item.type === 'HOTEL') linkHref = `/my-bookings/${item.entityId}`;
                if (item.type === 'RIDE') linkHref = `/rides/${item.entityId}`;
                if (item.type === 'GUIDE') linkHref = `/guides/bookings/${item.entityId}`;
                if (item.type === 'FOOD') linkHref = `/food/orders/${item.entityId}`;

                return (
                  <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-temple-100 text-temple-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {item.type === 'HOTEL' && '🏨'}
                      {item.type === 'GUIDE' && '🧑‍🏫'}
                      {item.type === 'RIDE' && '🚕'}
                      {item.type === 'FOOD' && '🍛'}
                    </div>
                    <a href={linkHref} className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-4 bg-white border border-temple-100 shadow hover:shadow-md transition-shadow cursor-pointer block">
                      <div className="text-xs text-gold-600 font-semibold mb-1">
                        {new Date(item.dateTime).toLocaleString()}
                      </div>
                      <h3 className="font-bold text-temple-800 group-hover:text-gold-700 transition-colors">{item.title}</h3>
                      <p className="text-sm text-temple-500">{item.subtitle}</p>
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && trip && (
            <div className="mt-12 bg-white rounded-xl shadow border border-temple-100 p-6">
              <h2 className="font-display text-xl font-bold text-temple-800 mb-4">Trip Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/rides" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">🚕</span>
                  <span className="text-sm font-semibold text-temple-700">Add Ride</span>
                </a>
                <a href="/guides" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">🧑‍🏫</span>
                  <span className="text-sm font-semibold text-temple-700">Add Guide</span>
                </a>
                <a href="/food" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">🍛</span>
                  <span className="text-sm font-semibold text-temple-700">Add Food</span>
                </a>
                <a href={`/support?tripId=${trip.id}`} className="p-3 bg-red-50 rounded-lg text-center hover:bg-red-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">🆘</span>
                  <span className="text-sm font-semibold text-red-700">Support</span>
                </a>
                <a href="/my-bookings" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">📅</span>
                  <span className="text-sm font-semibold text-temple-700">Change Booking</span>
                </a>
                <a href="/explore/map" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">📍</span>
                  <span className="text-sm font-semibold text-temple-700">Directions</span>
                </a>
                <a href="#" className="p-3 bg-temple-50 rounded-lg text-center hover:bg-temple-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">🧾</span>
                  <span className="text-sm font-semibold text-temple-700">Receipts</span>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Journey Memory sharing coming soon!'); }} className="p-3 bg-gold-50 rounded-lg text-center hover:bg-gold-100 transition flex flex-col items-center">
                  <span className="text-2xl mb-1">❤️</span>
                  <span className="text-sm font-semibold text-gold-700">Share Journey</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
          </div>
  );
}
