'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { fmtDate, formatINR, statusTone } from '@/lib/format';
import {
  Hotel,
  Calendar,
  Phone,
  Compass,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

type Booking = {
  id: string;
  bookingCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  roomsCount: number;
  roomName: string;
  hotel: {
    name: string;
    slug: string;
    contactPhone: string;
    addressLine1: string;
    city: string;
  };
  amounts: { totalPaise: number };
  paymentStatus: string;
};

const TABS = ['UPCOMING', 'PAST', 'CANCELLED'] as const;

function CustomerBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>('UPCOMING');

  const loadBookings = () => {
    setLoading(true);
    api
      .get<{ bookings: Booking[] }>('/api/bookings/mine', true)
      .then((r) => setBookings(r.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    if (tab === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    if (tab === 'PAST') return ['COMPLETED', 'NO_SHOW'].includes(b.status);
    return ['PENDING', 'CONFIRMED'].includes(b.status);
  });

  async function cancelBooking(id: string) {
    if (!confirm('Are you sure you want to cancel this booking? Free cancellation rules apply.')) return;
    try {
      await api.post(`/api/bookings/${id}/transition`, { action: 'CANCEL' }, true);
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
    } catch (err: any) {
      alert(err.message || 'Error cancelling booking');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <Hotel className="w-7 h-7 text-gold-600" /> My Hotel Stays & Reservations
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Verified hotel confirmations, room vouchers, and directions near Guruvayoor Temple.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadBookings}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/hotels" className="btn-gold text-xs py-2 px-3">
            Book Another Stay →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`badge px-4 py-2 text-xs font-semibold ${
              tab === t
                ? 'bg-temple-600 text-white shadow-sm'
                : 'bg-white text-temple-600 ring-1 ring-temple-200 hover:bg-temple-50'
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()} ({
              bookings.filter((b) => {
                if (t === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
                if (t === 'PAST') return ['COMPLETED', 'NO_SHOW'].includes(b.status);
                return ['PENDING', 'CONFIRMED'].includes(b.status);
              }).length
            })
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse bg-temple-50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-temple-400">
          <Hotel className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
          <p className="font-semibold text-temple-600">No {tab.toLowerCase()} stays found.</p>
          <p className="text-xs text-temple-400 mt-1">Browse pilgrim lodges within 500 meters of Guruvayoor Temple.</p>
          <Link href="/hotels" className="btn-primary text-xs mt-4 inline-block">
            Find Hotels near Temple
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="card p-6 border border-temple-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-lg font-bold text-temple-800">{b.hotel.name}</h3>
                    <span className={`badge text-xs ${statusTone(b.status)}`}>{b.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-temple-500">
                    Booking Code: <strong className="text-temple-800 font-mono">{b.bookingCode}</strong> · {b.roomName} × {b.roomsCount}
                  </p>
                </div>

                <div className="text-right">
                  <div className="font-display text-xl font-bold text-temple-800">
                    {formatINR(b.amounts.totalPaise)}
                  </div>
                  <div className="text-[11px] text-temple-400 uppercase tracking-wide">
                    {b.paymentStatus || 'Payment at Hotel / Confirmed'}
                  </div>
                </div>
              </div>

              <dl className="mt-4 pt-3 border-t border-temple-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase text-temple-400">Check-in</dt>
                  <dd className="font-semibold text-temple-700">{fmtDate(b.checkIn)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-temple-400">Check-out</dt>
                  <dd className="font-semibold text-temple-700">{fmtDate(b.checkOut)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-temple-400">Devotees</dt>
                  <dd className="font-semibold text-temple-700">{b.guests} Guests</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-temple-400">Duration</dt>
                  <dd className="font-semibold text-temple-700">{b.nights} Night{b.nights > 1 ? 's' : ''}</dd>
                </div>
              </dl>

              <div className="mt-5 pt-3 border-t border-temple-100 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${b.hotel.contactPhone}`} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Call Hotel
                  </a>
                  <a
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                    href={`https://www.google.com/maps/search/${encodeURIComponent(`${b.hotel.name} ${b.hotel.addressLine1} ${b.hotel.city}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Compass className="w-3.5 h-3.5" /> Directions
                  </a>
                </div>

                {['PENDING', 'CONFIRMED'].includes(b.status) && (
                  <button
                    onClick={() => cancelBooking(b.id)}
                    className="btn-outline text-xs py-1.5 px-3 !text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Cancel Stay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={<div className="card h-48 animate-pulse bg-temple-50" />}>
      <CustomerBookingsContent />
    </Suspense>
  );
}
