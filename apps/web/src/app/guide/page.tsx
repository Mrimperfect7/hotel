'use client';

import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';

type Dash = {
  guide: { name: string; status: string; hourlyPricePaise: number };
  stats: { pending: number; upcoming: number; revenuePaise: number };
  recentBookings: Array<{ id: string; date: string; status: string; totalPaise: number; customer: { name: string; phone: string } }>;
};

function Dash() {
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    api.get<Dash>('/api/guides/dashboard', true).then(setD).catch(() => {});
  }, []);

  if (!d) return <div className="card h-48 animate-pulse bg-temple-50" />;

  return (
    <div>
      {d.guide.status !== 'APPROVED' && (
        <div className="card mb-6 border-red-300 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ <strong>Account not active!</strong> Your guide profile is currently {d.guide.status}. 
          You will not receive new bookings until an admin approves your profile.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-temple-700">Welcome, {d.guide.name}</h1>
        <span className="badge bg-gold-100 text-gold-800">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {d.stats.pending > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold-50 p-4 ring-1 ring-gold-200">
          <p className="text-sm font-semibold text-gold-800">
            🔔 You have {d.stats.pending} pending booking request(s)!
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ['Upcoming Bookings', String(d.stats.upcoming), '📅'],
          ['Pending Requests', String(d.stats.pending), '⏳'],
          ['Total Revenue', formatINR(d.stats.revenuePaise), '💰'],
        ].map(([label, value, icon]) => (
          <div key={label} className="card p-4">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xl font-bold text-temple-700">{value}</div>
            <div className="text-[11px] uppercase tracking-wide text-temple-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-bold text-temple-700">Recent Bookings</h2>
        {d.recentBookings.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-temple-400">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-temple-50">
                {d.recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 font-medium text-temple-700">{fmtDate(b.date)}</td>
                    <td className="py-3 text-temple-600">{b.customer.name} <br/> <span className="text-xs text-temple-400">{b.customer.phone}</span></td>
                    <td className="py-3">
                      <span className={`badge ${b.status === 'CONFIRMED' ? 'bg-kerala-100 text-kerala-700' : b.status === 'PENDING' ? 'bg-gold-100 text-gold-800' : 'bg-temple-100 text-temple-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-temple-800">{formatINR(b.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-temple-400">No bookings found.</p>
        )}
      </div>
    </div>
  );
}

export default function GuideDashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dash />
    </Suspense>
  );
}
