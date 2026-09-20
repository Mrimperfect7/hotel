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
  deletedAt?: string | null;
};

const TABS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'REMOVED', 'ALL'] as const;

function Hotels() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'PENDING');
  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminHotel | null>(null);
  const [reason, setReason] = useState('');
  const [deleteModalHotel, setDeleteModalHotel] = useState<AdminHotel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleRemove(hotel: AdminHotel, permanent = false) {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/admin/hotels/${hotel.id}${permanent ? '?permanent=true' : ''}`, true);
      setDeleteModalHotel(null);
      setDetail(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove hotel';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRestore(hotel: AdminHotel) {
    await api.post(`/api/admin/hotels/${hotel.id}/restore`, {}, true);
    setDetail(null);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Hotel management</h1>
          <p className="text-xs text-temple-500">Approve, review, suspend, or remove hotel listings across Guruvayoor.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setStatus(t)}
              className={`badge transition-all ${status === t ? 'bg-temple-600 text-white shadow-sm' : 'bg-white text-temple-600 ring-1 ring-temple-200 hover:bg-temple-50'}`}>
              {t === 'UNDER_REVIEW' ? 'IN REVIEW' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card mt-6 h-48 animate-pulse bg-temple-50" />
      ) : hotels.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">
          {status === 'PENDING' ? '🎉 Verification queue is clear.' : status === 'REMOVED' ? 'No removed hotels found.' : 'No hotels with this status.'}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {hotels.map((h) => (
            <div key={h.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-temple-100 flex-shrink-0">
                {h.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.coverImage} alt={h.name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-temple-700">{h.name}</h3>
                  {h.deletedAt ? (
                    <span className="badge bg-red-100 text-red-700 ring-1 ring-red-200">REMOVED / UNLISTED</span>
                  ) : (
                    <span className={`badge ${statusTone(h.status)}`}>{h.status}</span>
                  )}
                </div>
                <p className="text-xs text-temple-400 mt-0.5">
                  {h.addressLine1}, {h.city} · 🛕 {h.distanceMeters != null ? distanceLabel(h.distanceMeters) : '?'} · {h.roomCount} rooms · from {formatINR(h.minPricePaise)}
                </p>
                <p className="text-xs text-temple-400">
                  Owner: {h.owner.name} · {h.owner.phone} · {h.owner.email}
                  {h.submittedAt ? ` · submitted ${fmtDate(h.submittedAt)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDetail(h)} className="btn-outline text-xs px-3 py-1.5">Review</button>

                {h.deletedAt ? (
                  <>
                    <button onClick={() => handleRestore(h)} className="btn bg-kerala-50 text-kerala-700 ring-1 ring-kerala-200 px-3 py-1.5 text-xs hover:bg-kerala-100 font-medium">
                      ↺ Restore
                    </button>
                    <button onClick={() => { setDeleteModalHotel(h); setDeleteError(null); }} className="btn bg-red-50 text-red-600 ring-1 ring-red-200 px-3 py-1.5 text-xs hover:bg-red-100">
                      🗑 Delete
                    </button>
                  </>
                ) : (
                  <>
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
                    <button
                      onClick={() => { setDeleteModalHotel(h); setDeleteError(null); }}
                      className="btn bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1.5 text-xs font-medium transition"
                      title="Remove or unlist this hotel">
                      🗑 Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-temple-900/40" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-temple-700">{detail.name}</h2>
                  <p className="text-xs text-temple-400">{detail.slug}</p>
                </div>
                <button onClick={() => setDetail(null)} className="text-temple-400 hover:text-temple-700 p-1 text-lg">✕</button>
              </div>

              {detail.deletedAt && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  ⚠️ This hotel is currently <strong>UNLISTED / REMOVED</strong> from the platform.
                </div>
              )}

              <h3 className="mt-4 text-sm font-bold text-temple-700">Documents</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {detail.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg bg-temple-50 p-2">
                    <span className="capitalize text-temple-600">{d.docType}{d.docNumber ? ` · ${d.docNumber}` : ''}</span>
                    <a href={d.url} target="_blank" rel="noreferrer" className="font-semibold text-gold-700 hover:underline">View</a>
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

              <div className="mt-6">
                <label className="label">Reason / message to owner (for reject, changes, or suspension)</label>
                <textarea className="input h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide feedback to the hotel partner..." />
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
                {detail.deletedAt && (
                  <button onClick={() => handleRestore(detail)} className="btn bg-kerala-600 text-xs text-white">↺ Restore to Approved</button>
                )}
              </div>
            </div>

            {/* Danger Zone: Remove Hotel */}
            <div className="mt-8 pt-4 border-t border-red-100 bg-red-50/50 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Danger Zone</h4>
              <p className="text-xs text-red-600 mt-1">Remove this hotel listing from public display or permanently delete it.</p>
              <button
                onClick={() => { setDeleteModalHotel(detail); setDeleteError(null); }}
                className="mt-3 btn bg-red-600 hover:bg-red-700 text-white text-xs w-full py-2 font-semibold">
                🗑 Remove this Hotel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteModalHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-temple-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl font-bold">
                ⚠️
              </div>
              <h3 className="font-display text-lg font-bold text-temple-800">Remove Hotel Listing</h3>
            </div>

            <p className="text-sm text-temple-600 mt-2">
              Are you sure you want to remove <strong className="text-temple-800 font-semibold">{deleteModalHotel.name}</strong> from Namma Guruvayoor?
            </p>

            <div className="mt-3 rounded-lg bg-temple-50 p-3 text-xs text-temple-600 space-y-1">
              <div>📍 <strong>Address:</strong> {deleteModalHotel.addressLine1}, {deleteModalHotel.city}</div>
              <div>🏨 <strong>Rooms:</strong> {deleteModalHotel.roomCount} total rooms</div>
              <div>📅 <strong>Active Bookings:</strong> {deleteModalHotel.bookings} booking records</div>
            </div>

            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                ❌ {deleteError}
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button
                disabled={isDeleting}
                onClick={() => handleRemove(deleteModalHotel, false)}
                className="btn w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 font-medium shadow-sm transition">
                {isDeleting ? 'Processing...' : 'Unlist & Remove from Search (Recommended)'}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleRemove(deleteModalHotel, true)}
                className="btn w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs py-2 transition font-medium">
                Permanently Delete from Database
              </button>
              <button
                disabled={isDeleting}
                onClick={() => { setDeleteModalHotel(null); setDeleteError(null); }}
                className="btn w-full btn-outline text-xs py-2 text-temple-500">
                Cancel
              </button>
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
