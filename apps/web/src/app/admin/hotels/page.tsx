'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { statusTone, fmtDate, formatINR, distanceLabel } from '@/lib/format';

type AdminHotel = {
  id: string; slug: string; name: string; status: string;
  owner: { name: string; phone: string; email: string };
  addressLine1: string; city: string; pincode: string;
  lat: number; lng: number; distanceMeters: number | null;
  roomCount: number; minPricePaise: number;
  documents: Array<{ id: string; docType: string; url: string; docNumber: string | null; verified: boolean }>;
  coverImage: string | null; bookings: number; reviews: number;
  submittedAt: string | null; rejectionReason: string | null;
};

const TABS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ALL'] as const;

function Hotels() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'PENDING');
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminHotel | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = status !== 'ALL' ? `?status=${status}` : '';
    api.get<{ hotels: AdminHotel[] }>(`/api/admin/hotels${q}`, true)
      .then((r) => setHotels(r.hotels))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  async function act(hotel: AdminHotel, action: string) {
    await api.patch(`/api/admin/hotels/${hotel.id}`, { action, reason: reason || undefined }, true);
    setDetail(null);
    setReason('');
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-temple-700">Hotel management</h1>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setStatus(t)}
              className={`badge ${status === t ? 'bg-temple-600 text-white' : 'bg-white text-temple-600 ring-1 ring-temple-200'}`}>
              {t === 'UNDER_REVIEW' ? 'IN REVIEW' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card mt-6 h-48 animate-pulse bg-temple-50" />
      ) : hotels.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">
          {status === 'PENDING' ? '🎉 Verification queue is clear.' : 'No hotels with this status.'}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {hotels.map((h) => (
            <div key={h.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-temple-100">
                {h.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.coverImage} alt={h.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-48 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-temple-700">{h.name}</h3>
                  <span className={`badge ${statusTone(h.status)}`}>{h.status}</span>
                </div>
                <p className="text-xs text-temple-400">
                  {h.addressLine1}, {h.city} · 🛕 {h.distanceMeters != null ? distanceLabel(h.distanceMeters) : '?'} · {h.roomCount} rooms · from {formatINR(h.minPricePaise)}
                </p>
                <p className="text-xs text-temple-400">
                  Owner: {h.owner.name} · {h.owner.phone} · {h.owner.email}
                  {h.submittedAt ? ` · submitted ${fmtDate(h.submittedAt)}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetail(h)} className="btn-outline text-xs">Review</button>
                {['PENDING', 'UNDER_REVIEW'].includes(h.status) && (
                  <>
                    <button onClick={() => act(h, 'APPROVE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Approve</button>
                    <button onClick={() => act(h, 'REJECT')} className="btn bg-red-50 px-3 py-1.5 text-xs text-red-600">Reject</button>
                  </>
                )}
                {h.status === 'APPROVED' && (
                  <button onClick={() => act(h, 'SUSPEND')} className="btn bg-gold-100 px-3 py-1.5 text-xs text-gold-800">Suspend</button>
                )}
                {['SUSPENDED', 'DEACTIVATED'].includes(h.status) && (
                  <button onClick={() => act(h, 'REACTIVATE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Reactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-temple-900/40" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-temple-700">{detail.name}</h2>
                <p className="text-xs text-temple-400">{detail.slug}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-temple-400">✕</button>
            </div>

            <h3 className="mt-4 text-sm font-bold text-temple-700">Documents</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {detail.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-lg bg-temple-50 p-2">
                  <span className="capitalize text-temple-600">{d.docType}{d.docNumber ? ` · ${d.docNumber}` : ''}</span>
                  <a href={d.url} target="_blank" rel="noreferrer" className="font-semibold text-gold-700">View</a>
                </li>
              ))}
              {detail.documents.length === 0 && <li className="text-temple-400">No documents attached.</li>}
            </ul>

            <h3 className="mt-4 text-sm font-bold text-temple-700">Location</h3>
            <iframe title="map" className="mt-2 h-40 w-full rounded-xl border-0"
              src={`https://maps.google.com/maps?q=${detail.lat},${detail.lng}&z=15&output=embed`} />
            <p className="mt-1 text-xs text-temple-400">🛕 {detail.distanceMeters != null ? `${distanceLabel(detail.distanceMeters)} from temple` : 'distance pending'}</p>

            <h3 className="mt-4 text-sm font-bold text-temple-700">Owner</h3>
            <p className="text-sm text-temple-600">{detail.owner.name} · {detail.owner.phone} · {detail.owner.email}</p>

            {['REJECT', 'REQUEST_CHANGES'].includes('') && null}
            <div className="mt-6">
              <label className="label">Reason / message to owner (for reject or changes)</label>
              <textarea className="input h-20" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.status === 'PENDING' && (
                <button onClick={() => act(detail, 'UNDER_REVIEW')} className="btn-outline text-xs">Start review</button>
              )}
              {['PENDING', 'UNDER_REVIEW'].includes(detail.status) && (
                <>
                  <button onClick={() => act(detail, 'APPROVE')} className="btn bg-kerala-500 text-xs text-white">✓ Approve & publish</button>
                  <button onClick={() => act(detail, 'REJECT')} className="btn bg-red-50 text-xs text-red-600">Reject</button>
                  <button onClick={() => act(detail, 'REQUEST_CHANGES')} className="btn bg-gold-100 text-xs text-gold-800">Request changes</button>
                </>
              )}
              {detail.status === 'APPROVED' && (
                <>
                  <button onClick={() => act(detail, 'SUSPEND')} className="btn bg-gold-100 text-xs text-gold-800">Suspend</button>
                  <button onClick={() => act(detail, 'DEACTIVATE')} className="btn bg-red-50 text-xs text-red-600">Deactivate</button>
                </>
              )}
              {['SUSPENDED', 'DEACTIVATED'].includes(detail.status) && (
                <button onClick={() => act(detail, 'REACTIVATE')} className="btn bg-kerala-500 text-xs text-white">Reactivate</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHotelsPage() {
  return (
    <Suspense fallback={null}>
      <Hotels />
    </Suspense>
  );
}
