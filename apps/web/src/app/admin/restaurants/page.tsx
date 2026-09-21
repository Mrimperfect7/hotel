'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { statusTone, fmtDate } from '@/lib/format';

type AdminRestaurant = {
  id: string; name: string; slug: string; status: string; phone: string;
  user: { name: string; phone: string; email: string };
  photos: string[]; cuisine: string[]; address: string;
  openingHours: string | null; deliveryAvailable: boolean;
  ratingAvg: number; reviewCount: number;
  createdAt: string;
};

const TABS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ALL'] as const;

function Restaurants() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'PENDING');
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminRestaurant | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = status !== 'ALL' ? `?status=${status}` : '';
    api.get<{ restaurants: AdminRestaurant[] }>(`/api/admin/restaurants${q}`, true)
      .then((r) => setRestaurants(r.restaurants))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  async function act(restaurant: AdminRestaurant, action: string) {
    await api.patch(`/api/admin/restaurants/${restaurant.id}`, { action, reason: reason || undefined }, true);
    setDetail(null);
    setReason('');
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Restaurant Management</h1>
          <p className="text-xs text-temple-500">Approve, review, suspend, or remove restaurants across Guruvayoor.</p>
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
      ) : restaurants.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">
          {status === 'PENDING' ? '🎉 Verification queue is clear.' : 'No restaurants with this status.'}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {restaurants.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-temple-100 flex-shrink-0">
                {r.photos && r.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photos[0]} alt={r.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🍛</div>
                )}
              </div>
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-temple-700">{r.name}</h3>
                  <span className={`badge ${statusTone(r.status)}`}>{r.status}</span>
                </div>
                <p className="text-xs text-temple-400 mt-0.5">
                  {r.cuisine.join(', ')} · {r.address}
                </p>
                <p className="text-xs text-temple-400">
                  {r.user.name} · {r.phone} · {r.user.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDetail(r)} className="btn-outline text-xs px-3 py-1.5">Review</button>

                {['PENDING', 'UNDER_REVIEW'].includes(r.status) && (
                  <>
                    <button onClick={() => act(r, 'APPROVE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Approve</button>
                    <button onClick={() => act(r, 'REJECT')} className="btn bg-red-50 px-3 py-1.5 text-xs text-red-600">Reject</button>
                  </>
                )}
                {r.status === 'APPROVED' && (
                  <button onClick={() => act(r, 'SUSPEND')} className="btn bg-gold-100 px-3 py-1.5 text-xs text-gold-800">Suspend</button>
                )}
                {r.status === 'SUSPENDED' && (
                  <button onClick={() => act(r, 'REACTIVATE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Reactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-temple-900/40" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-temple-700">Restaurant Profile</h2>
                <button onClick={() => setDetail(null)} className="text-temple-400 hover:text-temple-700 p-1 text-lg">✕</button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-24 overflow-hidden rounded-lg bg-temple-100">
                  {detail.photos && detail.photos.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.photos[0]} alt={detail.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🍛</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-temple-800">{detail.name}</h3>
                  <p className="text-sm text-temple-500">{detail.phone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Cuisine & Menu</h4>
                  <p className="text-sm text-temple-700">{detail.cuisine.join(', ')}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Location & Address</h4>
                  <p className="text-sm text-temple-700">{detail.address}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Operations</h4>
                  <p className="text-sm text-temple-700"><strong>Hours:</strong> {detail.openingHours || 'Not specified'}</p>
                  <p className="text-sm text-temple-700"><strong>Delivery:</strong> {detail.deliveryAvailable ? 'Available ✅' : 'Dine-in only ❌'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Linked Account</h4>
                  <p className="text-sm text-temple-700">{detail.user.name}</p>
                  <p className="text-sm text-temple-700">{detail.user.email}</p>
                  <p className="text-xs text-temple-400">Joined {fmtDate(detail.createdAt)}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-temple-100 pt-6">
                <label className="label">Reason / Feedback (for rejection or suspension)</label>
                <textarea className="input h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide feedback to the restaurant owner..." />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {detail.status === 'PENDING' && (
                  <button onClick={() => act(detail, 'UNDER_REVIEW')} className="btn-outline text-xs">Start review</button>
                )}
                {['PENDING', 'UNDER_REVIEW'].includes(detail.status) && (
                  <>
                    <button onClick={() => act(detail, 'APPROVE')} className="btn bg-kerala-500 text-xs text-white">✓ Approve</button>
                    <button onClick={() => act(detail, 'REJECT')} className="btn bg-red-50 text-xs text-red-600">Reject</button>
                  </>
                )}
                {detail.status === 'APPROVED' && (
                  <button onClick={() => act(detail, 'SUSPEND')} className="btn bg-gold-100 text-xs text-gold-800">Suspend</button>
                )}
                {detail.status === 'SUSPENDED' && (
                  <button onClick={() => act(detail, 'REACTIVATE')} className="btn bg-kerala-500 text-xs text-white">Reactivate</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRestaurantsPage() {
  return (
    <Suspense fallback={null}>
      <Restaurants />
    </Suspense>
  );
}
