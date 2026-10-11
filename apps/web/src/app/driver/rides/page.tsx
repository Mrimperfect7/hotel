'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';
import {
  Car,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  Navigation,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

type Ride = {
  id: string;
  date: string;
  time?: string;
  pickupLocation: string;
  destination: string;
  vehicleType: string;
  passengers?: number;
  status: string;
  estimatedPaise: number | null;
  finalPaise: number | null;
  customer: { name: string; phone: string };
};

type Dash = {
  driver: { name: string; isOnline: boolean; status: string };
  stats: { completed: number; revenuePaise: number };
  activeRide: Ride | null;
  availableRides: Ride[];
  recentRides: Ride[];
  allRides?: Ride[];
};

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'AVAILABLE', 'COMPLETED', 'CANCELLED'] as const;

function DriverRidesContent() {
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    api
      .get<Dash>('/api/rides/dashboard', true)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateRideStatus(rideId: string, nextStatus: string) {
    setUpdatingId(rideId);
    try {
      await api.patch(`/api/rides/${rideId}/status`, { status: nextStatus }, true);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update ride status');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="card h-28 animate-pulse bg-temple-50" />
        <div className="card h-48 animate-pulse bg-temple-50" />
      </div>
    );
  }

  const allList: Ride[] = data?.allRides || data?.recentRides || [];
  const active = data?.activeRide;
  const available = data?.availableRides || [];

  const filteredRides = allList.filter((r) => {
    if (filter === 'ACTIVE') return ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'RIDE_STARTED'].includes(r.status);
    if (filter === 'COMPLETED') return r.status === 'RIDE_COMPLETED';
    if (filter === 'CANCELLED') return r.status === 'CANCELLED';
    if (filter === 'AVAILABLE') return r.status === 'REQUESTED' || r.status === 'SEARCHING';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <Car className="w-7 h-7 text-gold-600" /> My Rides & Trips
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Manage your live journeys, devotee pickups, and ride earnings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/driver" className="btn-primary text-xs py-2 px-3">
            Dashboard →
          </Link>
        </div>
      </div>

      {/* Active Ongoing Ride Card */}
      {active && (
        <div className="rounded-2xl border-2 border-gold-400 bg-gradient-to-br from-gold-50 via-white to-amber-50 p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                Live Active Ride · {active.status.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="font-bold text-lg text-temple-900">
              {formatINR(active.finalPaise || active.estimatedPaise || 0)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase text-temple-400">Pickup Location</p>
                  <p className="font-bold text-temple-900 text-base">{active.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Navigation className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase text-temple-400">Destination</p>
                  <p className="font-bold text-temple-900 text-base">{active.destination}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/80 p-4 border border-gold-200 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase text-temple-400 font-semibold">Devotee / Passenger</p>
                <p className="font-bold text-temple-800 text-base mt-0.5">{active.customer.name}</p>
                <a
                  href={`tel:${active.customer.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:text-gold-800 mt-1"
                >
                  <Phone className="w-3.5 h-3.5" /> {active.customer.phone} (Call Devotee)
                </a>
              </div>

              {/* Status Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {active.status === 'DRIVER_ASSIGNED' && (
                  <button
                    onClick={() => updateRideStatus(active.id, 'DRIVER_ARRIVING')}
                    disabled={updatingId === active.id}
                    className="btn bg-kerala-600 text-white text-xs py-2 px-4 shadow hover:bg-kerala-700"
                  >
                    Mark Arrived at Pickup
                  </button>
                )}
                {active.status === 'DRIVER_ARRIVING' && (
                  <button
                    onClick={() => updateRideStatus(active.id, 'RIDE_STARTED')}
                    disabled={updatingId === active.id}
                    className="btn bg-kerala-600 text-white text-xs py-2 px-4 shadow hover:bg-kerala-700"
                  >
                    Start Trip
                  </button>
                )}
                {active.status === 'RIDE_STARTED' && (
                  <button
                    onClick={() => updateRideStatus(active.id, 'RIDE_COMPLETED')}
                    disabled={updatingId === active.id}
                    className="btn bg-emerald-600 text-white text-xs py-2 px-4 shadow hover:bg-emerald-700 font-bold"
                  >
                    Complete Trip ✓
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Cancel this active ride?')) {
                      updateRideStatus(active.id, 'CANCELLED');
                    }
                  }}
                  disabled={updatingId === active.id}
                  className="btn-outline text-xs !text-red-600 border-red-200 hover:bg-red-50 py-2 px-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Requests Section */}
      {available.length > 0 && (
        <div className="card p-5 border-emerald-200 bg-emerald-50/50">
          <h2 className="font-bold text-temple-800 text-base mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Nearby Ride Requests Waiting ({available.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {available.map((r) => (
              <div key={r.id} className="card p-4 bg-white border border-emerald-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-temple-800 text-sm">
                      {r.pickupLocation} <ArrowRight className="inline w-3 h-3 text-gold-600" /> {r.destination}
                    </p>
                    <span className="font-extrabold text-temple-700 text-sm">
                      {r.estimatedPaise ? formatINR(r.estimatedPaise) : 'Est. Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-temple-500 mt-1.5">
                    Devotee: {r.customer.name} · {r.customer.phone}
                  </p>
                </div>
                <button
                  onClick={() => updateRideStatus(r.id, 'DRIVER_ASSIGNED')}
                  disabled={updatingId === r.id}
                  className="btn bg-kerala-600 text-white text-xs py-2 mt-3 w-full hover:bg-kerala-700 font-bold"
                >
                  Accept Ride
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`badge px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              filter === s
                ? 'bg-temple-600 text-white shadow-sm'
                : 'bg-white text-temple-600 ring-1 ring-temple-200 hover:bg-temple-50'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Ride History Table */}
      <div className="card p-5">
        <h2 className="font-bold text-temple-800 text-base mb-4">
          Trip Log & History ({filteredRides.length})
        </h2>

        {filteredRides.length === 0 ? (
          <div className="text-center py-10 text-temple-400">
            <Car className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
            <p className="font-semibold text-temple-600">No rides found in this category.</p>
            <p className="text-xs text-temple-400 mt-1">
              New rides assigned to your taxi will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-temple-400 border-b border-temple-100">
                <tr>
                  <th className="py-2.5">Date & Time</th>
                  <th className="py-2.5">Route</th>
                  <th className="py-2.5">Passenger</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-temple-50">
                {filteredRides.map((r) => {
                  const isDone = r.status === 'RIDE_COMPLETED';
                  const isLive = ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'RIDE_STARTED'].includes(r.status);
                  const isCancelled = r.status === 'CANCELLED';

                  return (
                    <tr key={r.id} className="hover:bg-temple-50/50 transition-colors">
                      <td className="py-3 font-medium text-temple-700 whitespace-nowrap">
                        {fmtDate(r.date)} {r.time ? `· ${r.time}` : ''}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-temple-800">
                          {r.pickupLocation} ➔ {r.destination}
                        </div>
                        <div className="text-xs text-temple-400">{r.vehicleType || 'Taxi'}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-temple-700">{r.customer.name}</div>
                        <a href={`tel:${r.customer.phone}`} className="text-xs text-gold-600 hover:underline">
                          {r.customer.phone}
                        </a>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge text-xs ${
                            isDone
                              ? 'bg-kerala-100 text-kerala-700'
                              : isLive
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : isCancelled
                              ? 'bg-red-100 text-red-700'
                              : 'bg-temple-100 text-temple-600'
                          }`}
                        >
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-temple-800 whitespace-nowrap">
                        {formatINR(r.finalPaise || r.estimatedPaise || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverRidesPage() {
  return (
    <Suspense fallback={<div className="card h-48 animate-pulse bg-temple-50" />}>
      <DriverRidesContent />
    </Suspense>
  );
}
