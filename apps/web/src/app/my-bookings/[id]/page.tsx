'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { formatINR, fmtDate, statusTone } from '@/lib/format';
import {
  Hotel,
  Calendar,
  Phone,
  Compass,
  CheckCircle,
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react';

type BookingDetail = {
  id: string;
  bookingCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  roomsCount: number;
  hotel: {
    name: string;
    contactPhone: string;
    addressLine1: string;
    city: string;
    pincode: string;
  };
  rooms: Array<{ roomType: { name: string; basePricePaise: number }; roomsCount: number }>;
  amounts?: { totalPaise: number };
  totalPaise?: number;
  specialRequests?: string | null;
  customer?: { name: string; email: string; phone: string };
};

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/my-bookings/${id}`);
      return;
    }

    api
      .get<{ booking?: BookingDetail; data?: BookingDetail }>(`/api/bookings/${id}`, true)
      .then((res) => {
        setBooking(res.booking || res.data || null);
      })
      .catch(() => {
        // Fallback: try mine list
        api.get<{ bookings: any[] }>('/api/bookings/mine', true).then((r) => {
          const found = r.bookings?.find((b) => b.id === id);
          if (found) setBooking(found);
        }).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  if (!booking) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto my-12">
        <Hotel className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
        <h2 className="font-bold text-temple-800 text-lg">Booking Details</h2>
        <p className="text-sm text-temple-500 mt-1">Unable to locate this booking voucher or session expired.</p>
        <Link href="/my-bookings" className="btn-primary text-xs mt-4 inline-block">
          View All My Bookings
        </Link>
      </div>
    );
  }

  const totalPaise = booking.amounts?.totalPaise || booking.totalPaise || 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Link href="/my-bookings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-temple-600 hover:text-gold-700">
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </Link>

      {/* Voucher Header Card */}
      <div className="card p-6 border-gold-300 bg-gradient-to-br from-gold-50/50 via-white to-amber-50/30 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge bg-gold-200 text-gold-900 font-bold text-xs uppercase px-2.5 py-0.5">
              Official Stay Voucher
            </span>
            <h1 className="font-display text-2xl font-bold text-temple-900 mt-1.5">
              {booking.hotel.name}
            </h1>
            <p className="text-xs text-temple-600 mt-0.5">
              {booking.hotel.addressLine1}, {booking.hotel.city} {booking.hotel.pincode}
            </p>
          </div>

          <div className="text-right">
            <span className={`badge ${statusTone(booking.status)} text-xs px-3 py-1 font-bold`}>
              {booking.status}
            </span>
            <p className="font-mono font-bold text-sm text-temple-800 mt-1.5">
              #{booking.bookingCode}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gold-200 grid sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs uppercase text-temple-400 block font-semibold">Check-in</span>
            <span className="font-bold text-temple-800">{fmtDate(booking.checkIn)}</span>
          </div>
          <div>
            <span className="text-xs uppercase text-temple-400 block font-semibold">Check-out</span>
            <span className="font-bold text-temple-800">{fmtDate(booking.checkOut)}</span>
          </div>
          <div>
            <span className="text-xs uppercase text-temple-400 block font-semibold">Guests</span>
            <span className="font-bold text-temple-800">{booking.guests} Devotees</span>
          </div>
          <div>
            <span className="text-xs uppercase text-temple-400 block font-semibold">Total Amount</span>
            <span className="font-bold text-temple-900 text-base">{formatINR(totalPaise)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`tel:${booking.hotel.contactPhone}`}
            className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" /> Call Reception ({booking.hotel.contactPhone})
          </a>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(
              `${booking.hotel.name} ${booking.hotel.addressLine1} Guruvayoor`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" /> Google Maps Directions
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <BookingDetailContent />
    </Suspense>
  );
}
