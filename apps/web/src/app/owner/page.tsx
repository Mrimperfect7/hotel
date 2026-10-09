'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { ShieldCheck, Bell, Receipt, Calendar, LogOut, XCircle, Wallet, Bed, PlaneLanding } from 'lucide-react';

type Dash = {
  todayBookings: number; upcoming: number;
  checkInsToday: Array<{ id: string; bookingCode: string; guest: string; roomsCount: number; roomName: string }>;
  checkOutsToday: number; pending: number; cancelled: number;
  revenuePaise: number; totalRooms: number;
};

function Dash() {
  const params = useSearchParams();
  const submitted = params.get('submitted');
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    api.get<Dash>('/api/owner/dashboard', true).then(setD).catch(() => {});
  }, []);

  return (
    <div>
      {submitted && (
        <div className="card mb-6 border-kerala-300 bg-kerala-100 p-4 text-sm text-kerala-700 flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div>
            <strong>Registration received!</strong> Your property is currently under admin verification.
            You will be notified the moment it is approved — then it appears publicly and you can receive bookings.
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-temple-700">Today at your hotel</h1>
        <span className="badge bg-gold-100 text-gold-800">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      {d && d.pending > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold-50 p-4 ring-1 ring-gold-200">
          <p className="text-sm font-semibold text-gold-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span>{d.pending} booking request{d.pending > 1 ? 's' : ''} waiting for your response</span>
          </p>
          <Link href="/owner/bookings?status=PENDING" className="btn-gold text-xs">Review now</Link>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Bookings today', value: d ? String(d.todayBookings) : '…', icon: <Receipt className="w-6 h-6 text-temple-600" /> },
          { label: 'Upcoming confirmed', value: d ? String(d.upcoming) : '…', icon: <Calendar className="w-6 h-6 text-temple-600" /> },
          { label: 'Check-outs today', value: d ? String(d.checkOutsToday) : '…', icon: <LogOut className="w-6 h-6 text-temple-600" /> },
          { label: 'Cancelled (all time)', value: d ? String(d.cancelled) : '…', icon: <XCircle className="w-6 h-6 text-temple-600" /> },
          { label: 'Owner revenue', value: d ? formatINR(d.revenuePaise) : '…', icon: <Wallet className="w-6 h-6 text-temple-600" /> },
          { label: 'Total rooms', value: d ? String(d.totalRooms) : '…', icon: <Bed className="w-6 h-6 text-temple-600" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-4">
            <div className="mb-2">{icon}</div>
            <div className="mt-1 text-xl font-bold text-temple-700">{value}</div>
            <div className="text-[11px] uppercase tracking-wide text-temple-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-bold text-temple-700 flex items-center gap-2">
          <PlaneLanding className="w-5 h-5" /> Check-ins today
        </h2>
        {d && d.checkInsToday.length > 0 ? (
          <ul className="mt-3 divide-y divide-temple-50 text-sm">
            {d.checkInsToday.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="font-semibold text-temple-700">{c.guest}</span>
                <span className="text-temple-500">{c.roomName} × {c.roomsCount}</span>
                <span className="badge bg-kerala-100 text-kerala-700">{c.bookingCode}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-temple-400">No check-ins scheduled today.</p>
        )}
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dash />
    </Suspense>
  );
}
