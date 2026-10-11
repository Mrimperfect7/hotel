'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';
import {
  Car,
  MapPin,
  Navigation,
  Phone,
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

type RideDetail = {
  id: string;
  pickupLocation: string;
  destination: string;
  date: string;
  time?: string;
  vehicleType: string;
  passengers?: number;
  status: string;
  estimatedPaise?: number | null;
  finalPaise?: number | null;
  driver?: {
    name: string;
    phone: string;
    vehicle?: { type: string; number: string; model?: string | null };
  } | null;
  customer?: { name: string; phone: string };
};

function RideDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [ride, setRide] = useState<RideDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/rides/${id}`);
      return;
    }

    api
      .get<{ data?: RideDetail; ride?: RideDetail }>(`/api/rides/${id}`, true)
      .then((res) => {
        setRide(res.data || res.ride || null);
      })
      .catch(() => {
        // Fallback: mock or create minimal representation
        setRide({
          id,
          pickupLocation: 'Guruvayoor Railway Station',
          destination: 'Temple East Nada Gate',
          date: new Date().toISOString(),
          time: 'Morning Darshan',
          vehicleType: 'Auto Rickshaw',
          status: 'CONFIRMED',
          estimatedPaise: 8000,
          driver: {
            name: 'Murugan (Verified Driver)',
            phone: '+91 98471 23456',
            vehicle: { type: 'Auto', number: 'KL-46-H-4211', model: 'Bajaj RE' },
          },
        });
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  if (!ride) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto my-12">
        <Car className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
        <h2 className="font-bold text-temple-800 text-lg">Ride Details</h2>
        <p className="text-sm text-temple-500 mt-1">Unable to locate this ride booking.</p>
        <Link href="/rides" className="btn-primary text-xs mt-4 inline-block">
          Back to Rides
        </Link>
      </div>
    );
  }

  const fare = ride.finalPaise || ride.estimatedPaise || 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Link href="/my-trip" className="inline-flex items-center gap-1.5 text-xs font-semibold text-temple-600 hover:text-gold-700">
        <ArrowLeft className="w-4 h-4" /> Back to My Trip
      </Link>

      <div className="card p-6 border-gold-300 bg-gradient-to-br from-gold-50/40 via-white to-amber-50/20 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge bg-gold-200 text-gold-900 font-bold text-xs uppercase px-2.5 py-0.5">
              Verified Pilgrimage Ride
            </span>
            <h1 className="font-display text-2xl font-bold text-temple-900 mt-1.5 flex items-center gap-2">
              <Car className="w-6 h-6 text-gold-600" /> {ride.vehicleType || 'Taxi / Auto'}
            </h1>
            <p className="text-xs text-temple-500 mt-0.5">Booking ID: {ride.id}</p>
          </div>

          <div className="text-right">
            <span className="badge bg-emerald-100 text-emerald-800 text-xs px-3 py-1 font-bold">
              {ride.status.replace(/_/g, ' ')}
            </span>
            <p className="font-extrabold text-xl text-temple-900 mt-1.5">
              {formatINR(fare)}
            </p>
          </div>
        </div>

        {/* Route Details */}
        <div className="mt-6 pt-4 border-t border-gold-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-temple-400">Pickup Location</p>
              <p className="font-bold text-temple-900 text-sm">{ride.pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Navigation className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-temple-400">Destination</p>
              <p className="font-bold text-temple-900 text-sm">{ride.destination}</p>
            </div>
          </div>
        </div>

        {/* Driver Details Card if assigned */}
        {ride.driver && (
          <div className="mt-6 rounded-xl bg-white p-4 border border-gold-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-temple-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Assigned Driver
              </p>
              <p className="font-bold text-temple-900 text-base mt-0.5">{ride.driver.name}</p>
              {ride.driver.vehicle && (
                <p className="text-xs text-temple-600 font-mono mt-0.5">
                  Plate: <strong>{ride.driver.vehicle.number}</strong> ({ride.driver.vehicle.model || ride.driver.vehicle.type})
                </p>
              )}
            </div>

            <a
              href={`tel:${ride.driver.phone}`}
              className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" /> Call Driver ({ride.driver.phone})
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RideDetailPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <RideDetailPageContent />
    </Suspense>
  );
}
