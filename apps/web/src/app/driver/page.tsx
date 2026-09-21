'use client';
import Link from 'next/link';

import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';

type Dash = {
  driver: { name: string; status: string; isOnline: boolean };
  stats: { completed: number; revenuePaise: number };
  activeRide: { id: string; pickupLocation: string; destination: string; status: string; customer: { name: string; phone: string } } | null;
  availableRides: Array<{ id: string; date: string; pickupLocation: string; destination: string; status: string; estimatedPaise: number | null; customer: { name: string; phone: string } }>;
  recentRides: Array<{ id: string; date: string; status: string; finalPaise: number | null; customer: { name: string; phone: string } }>;
};

function Dash() {
  const [d, setD] = useState<Dash | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = () => {
    api.get<Dash>('/api/rides/dashboard', true).then(setD).catch(() => {});
  };

  useEffect(load, []);

  async function toggleOnline() {
    if (!d) return;
    setToggling(true);
    try {
      const res = await api.patch<{ isOnline: boolean }>('/api/rides/online', { isOnline: !d.driver.isOnline }, true);
      setD({ ...d, driver: { ...d.driver, isOnline: res.isOnline } });
    } finally {
      setToggling(false);
    }
  }

  async function acceptRide(id: string) {
    await api.patch(`/api/rides/${id}/status`, { status: 'DRIVER_ASSIGNED' }, true);
    load();
  }

  if (!d) return <div className="card h-48 animate-pulse bg-temple-50" />;

  return (
    <div>
      {d.driver.status !== 'APPROVED' && (
        <div className="card mb-6 border-red-300 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ <strong>Account not active!</strong> Your driver profile is currently {d.driver.status}. 
          You cannot go online or accept rides until an admin approves your profile.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Welcome, {d.driver.name}</h1>
          <p className="text-sm text-temple-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        {d.driver.status === 'APPROVED' && (
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-temple-200">
            <span className="text-sm font-semibold text-temple-700">Status:</span>
            <button
              onClick={toggleOnline}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${d.driver.isOnline ? 'bg-kerala-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${d.driver.isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold ${d.driver.isOnline ? 'text-kerala-600' : 'text-gray-500'}`}>
              {d.driver.isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        )}
      </div>

      {d.activeRide && (
        <div className="mt-6 rounded-xl border border-gold-300 bg-gold-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
            </span>
            <h2 className="font-bold text-gold-900 uppercase tracking-wide text-sm">Active Ride</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-temple-900">{d.activeRide.pickupLocation} ➔ {d.activeRide.destination}</p>
              <p className="text-sm text-temple-600 mt-1">Passenger: {d.activeRide.customer.name} · {d.activeRide.customer.phone}</p>
              <p className="text-sm font-semibold text-temple-700 mt-2">Status: {d.activeRide.status}</p>
            </div>
            <Link href="/driver/rides" className="btn-gold">Manage Ride</Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-2">
        {[
          ['Completed Rides', String(d.stats.completed), '🚕'],
          ['Total Earnings', formatINR(d.stats.revenuePaise), '💰'],
        ].map(([label, value, icon]) => (
          <div key={label} className="card p-4">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xl font-bold text-temple-700">{value}</div>
            <div className="text-[11px] uppercase tracking-wide text-temple-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="font-bold text-temple-700 mb-4">Available Ride Requests</h2>
          {!d.driver.isOnline ? (
            <div className="p-4 rounded-lg bg-temple-50 text-center text-sm text-temple-500">
              Go ONLINE to receive new ride requests.
            </div>
          ) : d.availableRides.length > 0 ? (
            <div className="space-y-3">
              {d.availableRides.map((r) => (
                <div key={r.id} className="rounded-lg border border-temple-100 bg-white p-3 shadow-sm">
                  <div className="flex justify-between">
                    <p className="font-semibold text-temple-800">{r.pickupLocation} ➔ {r.destination}</p>
                    <p className="font-bold text-temple-700">{r.estimatedPaise ? formatINR(r.estimatedPaise) : 'Est. pending'}</p>
                  </div>
                  <p className="text-xs text-temple-500 mt-1">{r.customer.name} · {r.customer.phone}</p>
                  <button onClick={() => acceptRide(r.id)} className="btn bg-kerala-500 text-white w-full mt-3 py-1.5 text-sm">
                    Accept Ride
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-temple-400">No ride requests in your area right now.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-temple-700 mb-4">Recent Rides</h2>
          {d.recentRides.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-temple-400 border-b border-temple-50">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-temple-50">
                  {d.recentRides.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 font-medium text-temple-700">{fmtDate(r.date)}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold ${r.status === 'RIDE_COMPLETED' ? 'text-kerala-600' : 'text-temple-500'}`}>
                          {r.status.replace('RIDE_', '')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-temple-800">{formatINR(r.finalPaise || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-temple-400">No recent rides found.</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default function DriverDashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dash />
    </Suspense>
  );
}
