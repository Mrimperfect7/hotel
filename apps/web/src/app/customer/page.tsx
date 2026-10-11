'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, fmtDate, statusTone } from '@/lib/format';
import {
  Hotel,
  Car,
  Compass,
  Utensils,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  LifeBuoy,
  Calendar
} from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Booking = {
  id: string;
  bookingCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  roomName: string;
  roomsCount: number;
  amounts: { totalPaise: number };
  hotel: { name: string; city: string };
};

type TripData = {
  id: string;
  name: string;
  tripCode?: string;
  items: Array<{ id: string; title: string; subtitle: string; type: string; dateTime: string }>;
};

function CustomerDashboardContent() {
  const [user, setUser] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get<{ user: UserData }>('/api/auth/me', true),
      api.get<{ bookings: Booking[] }>('/api/bookings/mine', true),
      api.get<{ data: TripData }>('/api/trips/me', true),
    ]).then(([uRes, bRes, tRes]) => {
      if (uRes.status === 'fulfilled') setUser(uRes.value.user);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.bookings || []);
      if (tRes.status === 'fulfilled') setTrip(tRes.value.data || null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card h-28 animate-pulse bg-temple-50" />
        <div className="card h-56 animate-pulse bg-temple-50" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) =>
    ['PENDING', 'CONFIRMED'].includes(b.status)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card p-6 bg-gradient-to-r from-temple-700 via-temple-800 to-gold-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 text-9xl select-none pointer-events-none">
          🛕
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="badge bg-gold-400 text-temple-900 font-bold text-xs uppercase px-3 py-1">
            Guruvayoor Pilgrim Portal
          </span>
          <h1 className="font-display text-3xl font-bold mt-2">
            Namaskaram, {user?.name || 'Devotee'} 🙏
          </h1>
          <p className="mt-1 text-temple-100 text-sm leading-relaxed">
            Welcome to your Guruvayoor darshan hub. Manage your verified stays, temple guides, taxi pickups, and custom pilgrimage itinerary.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between text-temple-400">
            <span className="text-xs uppercase font-semibold">Active Bookings</span>
            <Hotel className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-temple-800 mt-2">{upcomingBookings.length}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-temple-400">
            <span className="text-xs uppercase font-semibold">Trip Items</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-temple-800 mt-2">{trip?.items?.length || 0}</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-temple-400">
            <span className="text-xs uppercase font-semibold">Pilgrim Tier</span>
            <Sparkles className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-sm font-bold text-temple-800 mt-2">Returning Devotee</p>
          <span className="text-[11px] text-emerald-600 font-semibold">5% Darshan Discount</span>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-temple-400">
            <span className="text-xs uppercase font-semibold">24/7 Helpline</span>
            <LifeBuoy className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-sm font-bold text-red-600 mt-2">Emergency SOS Active</p>
          <Link href="/customer/support" className="text-[11px] text-gold-700 hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>

      {/* Quick Services Navigation */}
      <div className="card p-6">
        <h2 className="font-bold text-temple-800 text-base mb-4 flex items-center justify-between">
          <span>Pilgrim Services & Reservations</span>
          <Link href="/plan-trip" className="text-xs font-semibold text-gold-600 hover:underline">
            Auto-Plan Full Darshan Trip →
          </Link>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/hotels"
            className="p-4 rounded-xl bg-temple-50 hover:bg-temple-100 transition-all border border-temple-100 flex flex-col items-center text-center group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏨</span>
            <span className="font-bold text-sm text-temple-800">Book Stay</span>
            <span className="text-[11px] text-temple-500 mt-0.5">Near Temple Gates</span>
          </Link>

          <Link
            href="/rides"
            className="p-4 rounded-xl bg-temple-50 hover:bg-temple-100 transition-all border border-temple-100 flex flex-col items-center text-center group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🚕</span>
            <span className="font-bold text-sm text-temple-800">Book Ride</span>
            <span className="text-[11px] text-temple-500 mt-0.5">Station & Local Auto</span>
          </Link>

          <Link
            href="/guides"
            className="p-4 rounded-xl bg-temple-50 hover:bg-temple-100 transition-all border border-temple-100 flex flex-col items-center text-center group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🧑‍🏫</span>
            <span className="font-bold text-sm text-temple-800">Hire Guide</span>
            <span className="text-[11px] text-temple-500 mt-0.5">Temple Darshan Help</span>
          </Link>

          <Link
            href="/food"
            className="p-4 rounded-xl bg-temple-50 hover:bg-temple-100 transition-all border border-temple-100 flex flex-col items-center text-center group"
          >
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🍛</span>
            <span className="font-bold text-sm text-temple-800">Order Food</span>
            <span className="text-[11px] text-temple-500 mt-0.5">Pure Veg & Sadhya</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Stay Snapshot */}
      <div className="card p-6">
        <div className="flex items-center justify-between border-b border-temple-100 pb-3 mb-4">
          <h2 className="font-bold text-temple-800 text-base flex items-center gap-2">
            <Hotel className="w-5 h-5 text-gold-600" /> Current / Upcoming Hotel Stays
          </h2>
          <Link href="/customer/bookings" className="text-xs font-semibold text-gold-600 hover:underline">
            View All ({bookings.length}) →
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-8 text-temple-400">
            <Hotel className="w-10 h-10 mx-auto text-temple-200 mb-2 stroke-1" />
            <p className="font-medium text-temple-600 text-sm">No upcoming hotel stays.</p>
            <Link href="/hotels" className="btn-primary text-xs mt-3 inline-block">
              Find Hotels near Temple
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-temple-100 bg-temple-50/50 flex flex-wrap items-center justify-between gap-3 hover:bg-temple-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-temple-800">{b.hotel.name}</h3>
                    <span className={`badge text-xs ${statusTone(b.status)}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-temple-500 mt-0.5">
                    {b.roomName} × {b.roomsCount} · Check-in: {fmtDate(b.checkIn)} · Code: {b.bookingCode}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-temple-800 text-sm">
                    {formatINR(b.amounts.totalPaise)}
                  </span>
                  <Link href={`/customer/bookings`} className="btn-outline text-xs py-1.5 px-3">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
