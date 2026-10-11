'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Sparkles,
  HelpCircle
} from 'lucide-react';

type Booking = {
  id: string;
  date: string;
  startTime?: string | null;
  durationHours?: number | null;
  totalPaise: number;
  status: string;
  specialRequests?: string | null;
  customer: { name: string; phone: string };
};

type Dash = {
  guide: { name: string; status: string; hourlyPricePaise: number };
  stats: { pending: number; upcoming: number; revenuePaise: number };
  recentBookings: Booking[];
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'REJECTED'] as const;

function GuideBookingsContent() {
  const [data, setData] = useState<Dash | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [actingId, setActingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    api
      .get<Dash>('/api/guides/dashboard', true)
      .then((res) => {
        setData(res);
        setBookings(res.recentBookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateStatus(bookingId: string, status: 'CONFIRMED' | 'REJECTED' | 'COMPLETED') {
    setActingId(bookingId);
    try {
      await api.patch(`/api/guides/bookings/${bookingId}`, { status }, true);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status');
    } finally {
      setActingId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="card h-28 animate-pulse bg-temple-50" />
        <div className="card h-64 animate-pulse bg-temple-50" />
      </div>
    );
  }

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-gold-600" /> Guide Bookings & Pilgrims
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Review temple tour requests, accept devotees, and view completed darshan guiding logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link href="/guide" className="btn-primary text-xs py-2 px-3">
            Dashboard →
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs uppercase font-semibold text-temple-400">Total Bookings</p>
          <p className="text-2xl font-bold text-temple-800 mt-1">{bookings.length}</p>
        </div>
        <div className="card p-4 border-gold-200 bg-gold-50/50">
          <p className="text-xs uppercase font-semibold text-gold-700">Pending Requests</p>
          <p className="text-2xl font-bold text-gold-900 mt-1">{data?.stats?.pending ?? 0}</p>
        </div>
        <div className="card p-4 border-emerald-200 bg-emerald-50/50">
          <p className="text-xs uppercase font-semibold text-emerald-700">Confirmed Upcoming</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{data?.stats?.upcoming ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase font-semibold text-temple-400">Earnings</p>
          <p className="text-2xl font-bold text-temple-800 mt-1">
            {formatINR(data?.stats?.revenuePaise ?? 0)}
          </p>
        </div>
      </div>

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

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-temple-400">
          <Calendar className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
          <p className="font-semibold text-temple-600">No bookings found in this view.</p>
          <p className="text-xs text-temple-400 mt-1">
            Pilgrim bookings made for your profile will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => {
            const isPending = b.status === 'PENDING';
            const isConfirmed = b.status === 'CONFIRMED';
            const isCompleted = b.status === 'COMPLETED';
            const isRejected = b.status === 'REJECTED';

            return (
              <div
                key={b.id}
                className={`card p-5 border transition-all ${
                  isPending
                    ? 'border-gold-300 bg-gradient-to-r from-gold-50/40 via-white to-amber-50/20'
                    : isConfirmed
                    ? 'border-emerald-200'
                    : 'border-temple-100'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-temple-900 text-base">{b.customer.name}</span>
                      <span
                        className={`badge text-xs ${
                          isPending
                            ? 'bg-gold-100 text-gold-800 font-bold animate-pulse'
                            : isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : isCompleted
                            ? 'bg-kerala-100 text-kerala-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <a
                      href={`tel:${b.customer.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700 hover:text-gold-800"
                    >
                      <Phone className="w-3.5 h-3.5" /> {b.customer.phone} (Call Devotee)
                    </a>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-temple-900 text-lg">{formatINR(b.totalPaise)}</p>
                    <p className="text-xs text-temple-400">Total Guiding Dakshina</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-temple-100 grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs uppercase text-temple-400 block">Date of Darshan</span>
                    <span className="font-medium text-temple-700">{fmtDate(b.date)}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-temple-400 block">Start Time</span>
                    <span className="font-medium text-temple-700">{b.startTime || 'Standard Morning'}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-temple-400 block">Duration</span>
                    <span className="font-medium text-temple-700">
                      {b.durationHours ? `${b.durationHours} Hours` : 'Full Darshan Assistance'}
                    </span>
                  </div>
                </div>

                {b.specialRequests && (
                  <div className="mt-3 p-3 rounded-lg bg-temple-50 border border-temple-100 text-xs text-temple-700">
                    <strong className="text-temple-900">Devotee Requests:</strong> {b.specialRequests}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-temple-100 flex flex-wrap gap-2 justify-end">
                  {isPending && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, 'CONFIRMED')}
                        disabled={actingId === b.id}
                        className="btn bg-emerald-600 text-white text-xs py-2 px-4 shadow hover:bg-emerald-700 font-bold"
                      >
                        Accept & Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, 'REJECTED')}
                        disabled={actingId === b.id}
                        className="btn-outline text-xs !text-red-600 border-red-200 hover:bg-red-50 py-2 px-3"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <button
                      onClick={() => updateStatus(b.id, 'COMPLETED')}
                      disabled={actingId === b.id}
                      className="btn bg-kerala-600 text-white text-xs py-2 px-4 shadow hover:bg-kerala-700 font-bold"
                    >
                      Mark Darshan Completed ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GuideBookingsPage() {
  return (
    <Suspense fallback={<div className="card h-48 animate-pulse bg-temple-50" />}>
      <GuideBookingsContent />
    </Suspense>
  );
}
