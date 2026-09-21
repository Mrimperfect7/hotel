'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { api, ApiError, getToken } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { calculatePrice } from '@gsv/types';
import { QRCodeSVG } from 'qrcode.react';

type RoomInfo = {
  id: string; name: string; basePricePaise: number; maxOccupancy: number; acAvailable: boolean;
};
type HotelInfo = { id: string; name: string; slug: string; checkInTime: string; checkOutTime: string };

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Checkout() {
  const params = useSearchParams();
  const hotelId = params.get('hotel') ?? '';
  const roomId = params.get('room') ?? '';

  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [checkIn, setCheckIn] = useState(params.get('checkIn') ?? isoPlus(1));
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? isoPlus(3));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [requests, setRequests] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ bookingCode: string; id: string } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });
  
  // Payment state
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentData, setPaymentData] = useState<{ paymentId: string; upiUri: string; amountPaise: number } | null>(null);
  const [utr, setUtr] = useState('');

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
    if (!hotelId || !roomId) return;
    // Fetch hotel + room info from the public API for display only.
    api.get<{ hotels: Array<{ id: string; slug: string; name: string }> }>('/api/hotels?limit=50')
      .then(async (r) => {
        const h = r.hotels.find((x) => x.id === hotelId);
        if (!h) return;
        const detail = await api.get<{ hotel: HotelInfo & { roomTypes: RoomInfo[] } }>(`/api/hotels/${h.slug}`);
        setHotel({ id: detail.hotel.id, name: detail.hotel.name, slug: detail.hotel.slug, checkInTime: detail.hotel.checkInTime, checkOutTime: detail.hotel.checkOutTime });
        setRoom(detail.hotel.roomTypes.find((x) => x.id === roomId) ?? null);
      })
      .catch(() => {});
  }, [hotelId, roomId]);

  // Live estimate — the server recalculates and is authoritative.
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const estimate = room
    ? calculatePrice({ pricePerNightPaise: room.basePricePaise, nights, rooms })
    : { subtotalPaise: 0, taxPaise: 0, totalPaise: 0 };

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        hotelId, roomTypeId: roomId, checkIn, checkOut, guests, rooms,
        specialRequests: requests || undefined,
      };
      if (!loggedIn) payload.guest = guest;
      
      const res = await api.post<{ bookingId: string; bookingCode: string }>(
        '/api/bookings', payload, loggedIn
      );
      setDone({ bookingCode: res.bookingCode, id: res.bookingId });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function generatePayment() {
    if (!done) return;
    setBusy(true);
    try {
      const res = await api.post<{ paymentId: string; upiUri: string; amountPaise: number }>(
        '/api/payments/create', { bookingId: done.id }, loggedIn
      );
      setPaymentData(res);
      setPaymentStep(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error generating payment link.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentData || utr.length < 12) return;
    setBusy(true);
    try {
      await api.post('/api/payments/confirm', {
        paymentId: paymentData.paymentId,
        utr,
      }, loggedIn);
      window.location.href = `/booking/success?code=${done?.bookingCode}`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error verifying payment.');
      setBusy(false);
    }
  }

  if (paymentStep && paymentData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-temple-700 mb-2">Pay via UPI</h1>
        <p className="text-temple-600 mb-6">Scan the QR code below with GPay, PhonePe, or Paytm to complete your booking.</p>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-temple-100 flex flex-col items-center">
          <QRCodeSVG value={paymentData.upiUri} size={200} />
          <p className="mt-4 text-xl font-bold text-temple-900">{formatINR(paymentData.amountPaise)}</p>
          
          <a href={paymentData.upiUri} className="mt-4 btn bg-kerala-500 text-white w-full py-2 block md:hidden">
            Open UPI App
          </a>
        </div>

        <form onSubmit={confirmPayment} className="mt-8 card p-6 text-left">
          <h2 className="font-bold text-temple-700 mb-2">Enter UTR / Reference No.</h2>
          <p className="text-xs text-temple-500 mb-4">After paying, enter the 12-digit UPI Reference number to confirm your booking.</p>
          
          <input 
            type="text" 
            required 
            minLength={12} 
            maxLength={20}
            placeholder="e.g. 3145XXXXXXXX" 
            className="input w-full text-center text-lg tracking-widest font-mono"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
          />
          
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button disabled={busy || utr.length < 12} type="submit" className="btn-gold mt-4 w-full py-3">
            {busy ? 'Verifying...' : 'Submit Payment'}
          </button>
        </form>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-5xl">🙏</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-temple-700">Booking request saved!</h1>
        <p className="mt-2 text-temple-600">
          Your booking ID is <strong className="text-gold-700">{done.bookingCode}</strong>.
        </p>
        
        <div className="mt-8 p-6 bg-gold-50 border border-gold-200 rounded-2xl">
          <h2 className="font-bold text-temple-900 mb-2">Complete Payment to Confirm</h2>
          <p className="text-sm text-temple-600 mb-4">You must pay {formatINR(estimate.totalPaise)} to confirm your room.</p>
          <button onClick={generatePayment} disabled={busy} className="btn-gold w-full py-3 text-lg">
            Pay Now (Zero Fees)
          </button>
        </div>
        
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/my-bookings" className="btn-outline">Pay Later</Link>
        </div>
      </div>
    );
  }

  if (!hotelId || !roomId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-temple-700">Nothing selected yet</h1>
        <p className="mt-2 text-temple-500">Pick a hotel and room to start your booking.</p>
        <Link href="/hotels" className="btn-primary mt-4">Browse Hotels</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submitBooking} className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <h1 className="font-display text-2xl font-bold text-temple-700">
          {hotel?.name ?? 'Complete your booking'}
        </h1>
        {room && (
          <p className="text-sm text-temple-500">
            {room.name} · {room.acAvailable ? 'AC' : 'Non-AC'} · up to {room.maxOccupancy} guests/room
          </p>
        )}

        <div className="card grid gap-3 p-4 md:grid-cols-3">
          <div>
            <label className="label">Check-in</label>
            <input type="date" className="input" min={isoPlus(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div>
            <label className="label">Check-out</label>
            <input type="date" className="input" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rooms</label>
              <select className="input" value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>
                {[1,2,3,4,5].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Guests</label>
              <select className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {!loggedIn && (
          <div className="card space-y-3 p-4">
            <p className="text-sm text-temple-600">
              Booking as guest — or <Link href="/login" className="font-semibold text-gold-700">sign in</Link> to manage trips easily.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone (WhatsApp preferred)</label>
                <input className="input" required placeholder="98XXXXXXXX" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" required type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <div className="card p-4">
          <label className="label">Special requests (optional)</label>
          <textarea className="input h-24" placeholder="Early check-in for darshan, ground floor room, extra mattress…"
            value={requests} onChange={(e) => setRequests(e.target.value)} />
        </div>
      </div>

      <aside className="card h-fit p-5">
        <h2 className="font-bold text-temple-700">Price summary</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-temple-500">₹{estimate.subtotalPaise / 100 / nights / rooms || 0} × {nights} night{nights>1?'s':''} × {rooms} room{rooms>1?'s':''}</dt><dd /></div>
          <div className="flex justify-between"><dt className="text-temple-500">Subtotal</dt><dd className="font-semibold">{formatINR(estimate.subtotalPaise)}</dd></div>
          <div className="flex justify-between border-t border-temple-100 pt-2 text-base">
            <dt className="font-bold text-temple-700">Total payable</dt>
            <dd className="font-bold text-gold-700">{formatINR(estimate.totalPaise)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-temple-400">Final amount is confirmed by the server at booking time.</p>
        {hotel && (
          <p className="mt-3 text-xs text-temple-500">
            Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="btn-gold mt-4 w-full py-3 text-base">
          {busy ? 'Sending request…' : 'Continue to Payment'}
        </button>
      </aside>
    </form>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-temple-400">Preparing checkout…</div>}>
      <Checkout />
    </Suspense>
  );
}
