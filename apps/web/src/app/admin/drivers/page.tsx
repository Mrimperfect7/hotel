'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { statusTone, fmtDate } from '@/lib/format';

type AdminDriver = {
  id: string; name: string; status: string; phone: string;
  user: { name: string; phone: string; email: string };
  photoUrl: string | null; licenseNumber: string;
  serviceArea: string | null; isOnline: boolean;
  ratingAvg: number; reviewCount: number;
  vehicle: { type: string; number: string; model: string | null; insuranceDocs: string[] } | null;
  createdAt: string;
};

const TABS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ALL'] as const;

function Drivers() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'PENDING');
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminDriver | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = status !== 'ALL' ? `?status=${status}` : '';
    api.get<{ drivers: AdminDriver[] }>(`/api/admin/drivers${q}`, true)
      .then((r) => setDrivers(r.drivers))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  async function act(driver: AdminDriver, action: string) {
    await api.patch(`/api/admin/drivers/${driver.id}`, { action, reason: reason || undefined }, true);
    setDetail(null);
    setReason('');
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Driver Management</h1>
          <p className="text-xs text-temple-500">Approve, review, suspend, or remove drivers across Guruvayoor.</p>
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
      ) : drivers.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">
          {status === 'PENDING' ? '🎉 Verification queue is clear.' : 'No drivers with this status.'}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {drivers.map((d) => (
            <div key={d.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-temple-100 flex-shrink-0">
                {d.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.photoUrl} alt={d.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🚕</div>
                )}
              </div>
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-temple-700">{d.name}</h3>
                  <span className={`badge ${statusTone(d.status)}`}>{d.status}</span>
                </div>
                <p className="text-xs text-temple-400 mt-0.5">
                  {d.vehicle?.model || d.vehicle?.type || 'No vehicle info'} · {d.vehicle?.number || ''}
                </p>
                <p className="text-xs text-temple-400">
                  {d.user.name} · {d.phone} · {d.user.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDetail(d)} className="btn-outline text-xs px-3 py-1.5">Review</button>

                {['PENDING', 'UNDER_REVIEW'].includes(d.status) && (
                  <>
                    <button onClick={() => act(d, 'APPROVE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Approve</button>
                    <button onClick={() => act(d, 'REJECT')} className="btn bg-red-50 px-3 py-1.5 text-xs text-red-600">Reject</button>
                  </>
                )}
                {d.status === 'APPROVED' && (
                  <button onClick={() => act(d, 'SUSPEND')} className="btn bg-gold-100 px-3 py-1.5 text-xs text-gold-800">Suspend</button>
                )}
                {d.status === 'SUSPENDED' && (
                  <button onClick={() => act(d, 'REACTIVATE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Reactivate</button>
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
                <h2 className="font-display text-xl font-bold text-temple-700">Driver Profile</h2>
                <button onClick={() => setDetail(null)} className="text-temple-400 hover:text-temple-700 p-1 text-lg">✕</button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-temple-100">
                  {detail.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.photoUrl} alt={detail.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🚕</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-temple-800">{detail.name}</h3>
                  <p className="text-sm text-temple-500">{detail.phone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Driver License</h4>
                  <p className="text-sm font-semibold text-temple-700">{detail.licenseNumber}</p>
                </div>
                
                {detail.vehicle ? (
                  <div className="rounded-xl border border-temple-100 p-3 bg-temple-50">
                    <h4 className="text-xs font-bold uppercase text-temple-400 mb-2">Registered Vehicle</h4>
                    <p className="text-sm text-temple-700"><strong>Type:</strong> {detail.vehicle.type}</p>
                    <p className="text-sm text-temple-700"><strong>Model:</strong> {detail.vehicle.model || 'N/A'}</p>
                    <p className="text-sm text-temple-700"><strong>Number Plate:</strong> {detail.vehicle.number}</p>
                    {detail.vehicle.insuranceDocs.length > 0 && (
                      <div className="mt-2 text-xs text-temple-500">
                        Insurance Docs: {detail.vehicle.insuranceDocs.length} uploaded
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-500 italic">No vehicle registered yet.</p>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Service Area</h4>
                  <p className="text-sm text-temple-700">{detail.serviceArea || 'Guruvayoor (All areas)'}</p>
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
                <textarea className="input h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide feedback to the driver..." />
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

export default function AdminDriversPage() {
  return (
    <Suspense fallback={null}>
      <Drivers />
    </Suspense>
  );
}
