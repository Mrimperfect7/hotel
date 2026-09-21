'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, formatINR, statusTone } from '@/lib/format';

type AdminBooking = {
  id: string; bookingCode: string; status: string; hotelName: string;
  customerName: string; customerPhone: string | null; roomName: string;
  checkIn: string; checkOut: string; guests: number; roomsCount: number;
  totalPaise: number; commissionPaise: number; paymentStatus: string; 
  paymentId?: string; utr?: string; createdAt: string;
};

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [filters, setFilters] = useState({ status: '', code: '', customer: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.status) p.set('status', filters.status);
    if (filters.code) p.set('code', filters.code);
    if (filters.customer) p.set('customer', filters.customer);
    api.get<{ bookings: AdminBooking[] }>(`/api/admin/bookings?${p.toString()}`, true)
      .then((r) => setRows(r.bookings))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);

  async function cancelBooking(id: string) {
    if (!confirm('Cancel this booking on behalf of the platform?')) return;
    await api.post(`/api/bookings/${id}/transition`, { action: 'CANCEL', reason: 'Cancelled by platform admin' }, true);
    load();
  }

  async function verifyPayment(paymentId: string, action: 'APPROVE' | 'REJECT') {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payment UTR?`)) return;
    try {
      await api.post(`/api/payments/verify`, { paymentId, action }, true);
      load();
    } catch (e: any) {
      alert(e.message || 'Error verifying payment');
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-temple-700">All bookings</h1>

      <div className="card mt-4 grid gap-3 p-4 md:grid-cols-4">
        <div>
          <label className="label">Booking ID</label>
          <input className="input" placeholder="GV-2026-…" value={filters.code} onChange={(e) => setFilters({ ...filters, code: e.target.value })} />
        </div>
        <div>
          <label className="label">Customer</label>
          <input className="input" placeholder="name / phone / email" value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end"><button onClick={load} className="btn-primary w-full">Apply filters</button></div>
      </div>

      {loading ? (
        <div className="card mt-6 h-48 animate-pulse bg-temple-50" />
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-temple-100 text-[11px] uppercase tracking-wide text-temple-400">
                <th className="p-3">Booking</th><th className="p-3">Hotel</th><th className="p-3">Guest</th>
                <th className="p-3">Stay</th><th className="p-3">Total</th><th className="p-3">Commission</th>
                <th className="p-3">Payment</th><th className="p-3">Status</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-temple-50">
                  <td className="p-3 font-mono text-xs text-gold-700">{b.bookingCode}</td>
                  <td className="p-3">{b.hotelName}</td>
                  <td className="p-3">
                    <div className="font-semibold text-temple-700">{b.customerName}</div>
                    <div className="text-xs text-temple-400">{b.customerPhone}</div>
                  </td>
                  <td className="p-3">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    <div className="text-xs text-temple-400">{b.roomName} × {b.roomsCount}</div>
                  </td>
                  <td className="p-3 font-semibold">{formatINR(b.totalPaise)}</td>
                  <td className="p-3 text-kerala-600">{formatINR(b.commissionPaise)}</td>
                  <td className="p-3">
                    <span className="badge bg-temple-50 text-temple-600">{b.paymentStatus}</span>
                    {b.utr && <div className="mt-1 text-[10px] text-temple-500 font-mono">UTR: {b.utr}</div>}
                  </td>
                  <td className="p-3"><span className={`badge ${statusTone(b.status)}`}>{b.status}</span></td>
                  <td className="p-3 flex gap-2">
                    {b.paymentStatus === 'PENDING_VERIFICATION' && b.paymentId && (
                      <>
                        <button onClick={() => verifyPayment(b.paymentId!, 'APPROVE')} className="btn bg-kerala-50 px-2 py-1 text-xs text-kerala-700">Approve</button>
                        <button onClick={() => verifyPayment(b.paymentId!, 'REJECT')} className="btn bg-red-50 px-2 py-1 text-xs text-red-600">Reject</button>
                      </>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(b.status) && (
                      <button onClick={() => cancelBooking(b.id)} className="btn bg-red-50 px-3 py-1 text-xs text-red-600">Cancel</button>
                    )}
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
