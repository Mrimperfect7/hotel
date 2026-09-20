'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, formatINR } from '@/lib/format';

type TrackedBooking = {
  bookingCode: string; status: string; checkIn: string; checkOut: string;
  nights: number; guests: number; roomsCount: number; roomName: string;
  hotel: { name: string; contactPhone: string; addressLine1?: string; city?: string };
  amounts: { totalPaise: number };
  paymentStatus: string;
};

function Success() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [contact, setContact] = useState('');
  const [booking, setBooking] = useState<TrackedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBooking(null);
    try {
      const res = await api.get<{ booking: TrackedBooking }>(
        `/api/bookings/track?code=${encodeURIComponent(code)}&contact=${encodeURIComponent(contact)}`
      );
      setBooking(res.booking);
    } catch {
      setError('No booking found for that ID and contact. Double-check both.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="card p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 font-display text-2xl font-bold text-temple-700">Your darshan trip is planned!</h1>
        <p className="mt-2 text-sm text-temple-500">
          The hotel received your request and will confirm soon. Save your booking ID — you can track the
          status anytime below.
        </p>

        <form onSubmit={lookup} className="mt-6 grid gap-3 text-left md:grid-cols-3">
          <div>
            <label className="label">Booking ID</label>
            <input className="input" placeholder="GV-2026-483921" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="label">Phone or email used</label>
            <input className="input" placeholder="98XXXXXXXX / you@email.com" value={contact} onChange={(e) => setContact(e.target.value)} required />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full">Track Booking</button>
          </div>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      </div>

      {booking && (
        <div className="card mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-temple-700">{booking.hotel.name}</h2>
            <span className="badge bg-gold-100 text-gold-800">{booking.status}</span>
          </div>
          <p className="mt-1 text-xs text-temple-400">Booking ID: <strong>{booking.bookingCode}</strong></p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-temple-400">Check-in</dt><dd className="font-semibold">{fmtDate(booking.checkIn)}</dd></div>
            <div><dt className="text-temple-400">Check-out</dt><dd className="font-semibold">{fmtDate(booking.checkOut)}</dd></div>
            <div><dt className="text-temple-400">Room</dt><dd className="font-semibold">{booking.roomName} × {booking.roomsCount}</dd></div>
            <div><dt className="text-temple-400">Guests</dt><dd className="font-semibold">{booking.guests}</dd></div>
            <div><dt className="text-temple-400">Total</dt><dd className="font-semibold">{formatINR(booking.amounts.totalPaise)}</dd></div>
            <div><dt className="text-temple-400">Payment</dt><dd className="font-semibold">{booking.paymentStatus}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${booking.hotel.contactPhone}`} className="btn-outline">📞 Contact Hotel</a>
            <button onClick={() => window.print()} className="btn-outline">🖨 Download / Print</button>
            <Link href="/hotels" className="btn-primary">Plan another stay</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-temple-400">Loading…</div>}>
      <Success />
    </Suspense>
  );
}
