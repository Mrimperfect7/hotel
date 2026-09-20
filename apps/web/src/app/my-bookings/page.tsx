'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { fmtDate, formatINR, statusTone } from '@/lib/format';

type Booking = {
  id: string; bookingCode: string; status: string; checkIn: string; checkOut: string;
  nights: number; guests: number; roomsCount: number; roomName: string;
  hotel: { name: string; slug: string; contactPhone: string; addressLine1: string; city: string };
  amounts: { totalPaise: number }; paymentStatus: string;
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');

  useEffect(() => {
    if (!getToken()) { router.push('/login?next=/my-bookings'); return; }
    api.get<{ bookings: Booking[] }>('/api/bookings/mine', true)
      .then((r) => setBookings(r.bookings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = bookings.filter((b) => {
    if (tab === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    if (tab === 'PAST') return ['COMPLETED', 'NO_SHOW'].includes(b.status);
    return ['PENDING', 'CONFIRMED'].includes(b.status);
  });

  async function cancel(id: string) {
    if (!confirm('Cancel this booking? Cancellation rules apply.')) return;
    await api.post(`/api/bookings/${id}/transition`, { action: 'CANCEL' }, true);
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-temple-700">My Bookings</h1>

      <div className="mt-4 flex gap-2">
        {(['UPCOMING', 'PAST', 'CANCELLED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`badge px-4 py-1.5 ${tab === t ? 'bg-temple-600 text-white' : 'bg-white text-temple-600 ring-1 ring-temple-200'}`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-temple-50" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <div className="text-3xl">🧳</div>
          <p className="mt-2 text-temple-500">No bookings in this view yet.</p>
          <Link href="/hotels" className="btn-primary mt-4">Find a stay</Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-temple-700">{b.hotel.name}</h3>
                    <span className={`badge ${statusTone(b.status)}`}>{b.status}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-temple-400">{b.bookingCode} · {b.roomName} × {b.roomsCount}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-temple-700">{formatINR(b.amounts.totalPaise)}</div>
                  <div className="text-[11px] text-temple-400">{b.paymentStatus}</div>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                <div><dt className="text-temple-400 text-xs">Check-in</dt><dd>{fmtDate(b.checkIn)}</dd></div>
                <div><dt className="text-temple-400 text-xs">Check-out</dt><dd>{fmtDate(b.checkOut)}</dd></div>
                <div><dt className="text-temple-400 text-xs">Guests</dt><dd>{b.guests}</dd></div>
                <div><dt className="text-temple-400 text-xs">Nights</dt><dd>{b.nights}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`tel:${b.hotel.contactPhone}`} className="btn-outline text-xs">📞 Contact hotel</a>
                <a
                  className="btn-outline text-xs"
                  href={`https://www.google.com/maps/search/${encodeURIComponent(`${b.hotel.name} ${b.hotel.addressLine1} ${b.hotel.city}`)}`}
                  target="_blank" rel="noreferrer"
                >
                  🧭 Directions
                </a>
                {['PENDING', 'CONFIRMED'].includes(b.status) && (
                  <button onClick={() => cancel(b.id)} className="btn-outline text-xs !text-red-600">Cancel booking</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
