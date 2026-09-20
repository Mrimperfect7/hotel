'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, formatINR, statusTone } from '@/lib/format';

type OwnerBooking = {
  id: string; bookingCode: string; status: string;
  customer: { name: string; phone: string | null; email: string | null; whatsapp: string | null };
  hotelName: string;
  roomName: string; checkIn: string; checkOut: string; nights: number;
  guests: number; roomsCount: number; amounts: { totalPaise: number };
  ownerPayoutPaise: number; specialRequests: string | null;
};

// Platform WhatsApp bot number (Gupshup sender number, without +)
const PLATFORM_WA = (process.env.NEXT_PUBLIC_PLATFORM_WHATSAPP ?? '').replace(/\D/g, '');

/** Build wa.me link to platform bot with booking context pre-filled */
function platformWaLink(b: OwnerBooking): string {
  const text = encodeURIComponent(
    `Re: Booking ${b.bookingCode} — ${b.hotelName ?? b.roomName}\nGuest: ${b.customer.name}\nCheck-in: ${b.checkIn.slice(0, 10)}`
  );
  return `https://wa.me/${PLATFORM_WA}?text=${text}`;
}

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'] as const;

function Bookings() {
  const params = useSearchParams();
  const [rows, setRows] = useState<OwnerBooking[]>([]);
  const [status, setStatus] = useState<string>(params.get('status') ?? 'ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = status !== 'ALL' ? `?status=${status}` : '';
    api.get<{ bookings: OwnerBooking[] }>(`/api/owner/bookings${q}`, true)
      .then((r) => setRows(r.bookings))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  async function act(id: string, action: 'CONFIRM' | 'REJECT' | 'CANCEL') {
    const reason = action !== 'CONFIRM' ? prompt(`Reason for ${action.toLowerCase()} (shared with guest):`) ?? undefined : undefined;
    await api.patch(`/api/owner/bookings/${id}`, { action, reason }, true);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-temple-700">Bookings</h1>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`badge ${status === s ? 'bg-temple-600 text-white' : 'bg-white text-temple-600 ring-1 ring-temple-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card mt-6 h-40 animate-pulse bg-temple-50" />
      ) : rows.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">No bookings with this status.</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-temple-100 text-[11px] uppercase tracking-wide text-temple-400">
                <th className="p-3">Booking</th><th className="p-3">Guest</th><th className="p-3">Room</th>
                <th className="p-3">Stay</th><th className="p-3">Amount</th><th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-temple-50 align-top">
                  <td className="p-3 font-mono text-xs text-gold-700">{b.bookingCode}</td>
                  <td className="p-3">
                    <div className="font-semibold text-temple-700">{b.customer.name}</div>
                    {b.customer.phone && <div className="text-xs text-temple-400">{b.customer.phone}</div>}
                    {b.specialRequests && <div className="mt-1 max-w-48 rounded bg-gold-50 p-1 text-[11px] text-gold-800">“{b.specialRequests}”</div>}
                  </td>
                  <td className="p-3">{b.roomName} × {b.roomsCount}</td>
                  <td className="p-3">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    <div className="text-xs text-temple-400">{b.nights} night{b.nights > 1 ? 's' : ''} · {b.guests} guests</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold">{formatINR(b.amounts.totalPaise)}</div>
                    <div className="text-[11px] text-kerala-600">you get {formatINR(b.ownerPayoutPaise)}</div>
                  </td>
                  <td className="p-3"><span className={`badge ${statusTone(b.status)}`}>{b.status}</span></td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => act(b.id, 'CONFIRM')} className="btn bg-kerala-500 px-3 py-1 text-xs text-white">✓ Confirm</button>
                          <button onClick={() => act(b.id, 'REJECT')} className="btn bg-red-50 px-3 py-1 text-xs text-red-600">✕ Reject</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => act(b.id, 'CANCEL')} className="btn bg-red-50 px-3 py-1 text-xs text-red-600">Cancel</button>
                      )}
                      {PLATFORM_WA && (
                        <a href={platformWaLink(b)} target="_blank" rel="noreferrer"
                          className="btn bg-[#25D366]/10 px-3 py-1 text-xs text-[#128C7E]">💬 Chat via Bot</a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OwnerBookingsPage() {
  return (
    <Suspense fallback={null}>
      <Bookings />
    </Suspense>
  );
}
