'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';

type Stats = {
  hotels: { total: number; pending: number; approved: number; rejected: number; suspended: number };
  users: { customers: number; owners: number };
  bookings: { total: number; today: number; upcomingCheckins: number; cancelled: number };
  revenuePaise: number; commissionPaise: number;
};

export default function AdminOverviewPage() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/api/admin/stats', true).then(setS).catch(() => {});
  }, []);

  const cards: Array<[string, string | undefined, string]> = s ? [
    ['Total hotels', String(s.hotels.total), '🏨'],
    ['Pending verification', String(s.hotels.pending), '⏳'],
    ['Approved', String(s.hotels.approved), '✅'],
    ['Suspended', String(s.hotels.suspended), '🚫'],
    ['Customers', String(s.users.customers), '👥'],
    ['Owners', String(s.users.owners), '🔑'],
    ['Bookings (all)', String(s.bookings.total), '🧾'],
    ['Bookings today', String(s.bookings.today), '📆'],
    ['Upcoming check-ins', String(s.bookings.upcomingCheckins), '🛬'],
    ['Cancelled', String(s.bookings.cancelled), '↩️'],
    ['Gross revenue', formatINR(s.revenuePaise), '💰'],
    ['Platform commission', formatINR(s.commissionPaise), '🏛️'],
  ] : [];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-temple-700">Platform overview</h1>
      {s && s.hotels.pending > 0 && (
        <div className="mt-4 rounded-xl bg-gold-50 p-4 text-sm font-semibold text-gold-800 ring-1 ring-gold-200">
          ⏳ {s.hotels.pending} hotel application{s.hotels.pending > 1 ? 's' : ''} awaiting verification —{' '}
          <a href="/admin/hotels?status=PENDING" className="underline">review now</a>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, icon]) => (
          <div key={label} className="card p-4">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xl font-bold text-temple-700">{value ?? '…'}</div>
            <div className="text-[11px] uppercase tracking-wide text-temple-400">{label}</div>
          </div>
        ))}
        {!s && [...Array(8)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-temple-50" />)}
      </div>

      {s && (
        <div className="card mt-6 p-5">
          <h2 className="font-bold text-temple-700">Hotel pipeline</h2>
          <div className="mt-3 space-y-2">
            {([
              ['Approved', s.hotels.approved, 'bg-kerala-500'],
              ['Pending / Under review', s.hotels.pending, 'bg-gold-400'],
              ['Rejected', s.hotels.rejected, 'bg-red-300'],
              ['Suspended', s.hotels.suspended, 'bg-temple-300'],
            ] as Array<[string, number, string]>).map(([label, n, color]) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-40 text-temple-500">{label}</span>
                <div className="h-4 flex-1 rounded-full bg-temple-50">
                  <div className={`h-4 rounded-full ${color}`} style={{ width: `${s.hotels.total ? (n / s.hotels.total) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-temple-700">{n}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-temple-400">
            Avg booking value: {formatINR(s.bookings.total ? Math.round(s.revenuePaise / s.bookings.total) : 0)} ·
            Cancellation rate: {s.bookings.total ? Math.round((s.bookings.cancelled / s.bookings.total) * 100) : 0}%
          </p>
        </div>
      )}
    </div>
  );
}
