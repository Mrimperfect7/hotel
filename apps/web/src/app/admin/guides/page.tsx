'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { statusTone, fmtDate, formatINR } from '@/lib/format';

type AdminGuide = {
  id: string; name: string; status: string; phone: string;
  user: { name: string; phone: string; email: string };
  photoUrl: string | null; languages: string[];
  experienceYears: number; specialization: string | null; description: string | null;
  serviceArea: string | null;
  hourlyPricePaise: number; halfDayPricePaise: number; fullDayPricePaise: number;
  rejectionReason: string | null; ratingAvg: number; reviewCount: number;
  createdAt: string;
};

const TABS = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ALL'] as const;

function Guides() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string>(params.get('status') ?? 'PENDING');
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminGuide | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = status !== 'ALL' ? `?status=${status}` : '';
    api.get<{ guides: AdminGuide[] }>(`/api/admin/guides${q}`, true)
      .then((r) => setGuides(r.guides))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(load, [load]);

  async function act(guide: AdminGuide, action: string) {
    await api.patch(`/api/admin/guides/${guide.id}`, { action, reason: reason || undefined }, true);
    setDetail(null);
    setReason('');
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Guide Management</h1>
          <p className="text-xs text-temple-500">Approve, review, suspend, or remove guides across Guruvayoor.</p>
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
      ) : guides.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-temple-500">
          {status === 'PENDING' ? '🎉 Verification queue is clear.' : 'No guides with this status.'}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-md">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-temple-100 flex-shrink-0">
                {g.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.photoUrl} alt={g.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">🧑‍🏫</div>
                )}
              </div>
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-temple-700">{g.name}</h3>
                  <span className={`badge ${statusTone(g.status)}`}>{g.status}</span>
                </div>
                <p className="text-xs text-temple-400 mt-0.5">
                  {g.languages.join(', ')} · {g.experienceYears} yrs exp · {g.serviceArea || 'Anywhere'}
                </p>
                <p className="text-xs text-temple-400">
                  {g.user.name} · {g.phone} · {g.user.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setDetail(g)} className="btn-outline text-xs px-3 py-1.5">Review</button>

                {['PENDING', 'UNDER_REVIEW'].includes(g.status) && (
                  <>
                    <button onClick={() => act(g, 'APPROVE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Approve</button>
                    <button onClick={() => act(g, 'REJECT')} className="btn bg-red-50 px-3 py-1.5 text-xs text-red-600">Reject</button>
                  </>
                )}
                {g.status === 'APPROVED' && (
                  <button onClick={() => act(g, 'SUSPEND')} className="btn bg-gold-100 px-3 py-1.5 text-xs text-gold-800">Suspend</button>
                )}
                {g.status === 'SUSPENDED' && (
                  <button onClick={() => act(g, 'REACTIVATE')} className="btn bg-kerala-500 px-3 py-1.5 text-xs text-white">Reactivate</button>
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
                <h2 className="font-display text-xl font-bold text-temple-700">Guide Profile</h2>
                <button onClick={() => setDetail(null)} className="text-temple-400 hover:text-temple-700 p-1 text-lg">✕</button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-temple-100">
                  {detail.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={detail.photoUrl} alt={detail.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🧑‍🏫</div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-temple-800">{detail.name}</h3>
                  <p className="text-sm text-temple-500">{detail.phone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Languages & Experience</h4>
                  <p className="text-sm text-temple-700">{detail.languages.join(', ')}</p>
                  <p className="text-sm text-temple-700">{detail.experienceYears} years experience</p>
                  {detail.specialization && <p className="text-sm text-temple-700">Specializes in: {detail.specialization}</p>}
                </div>
                
                {detail.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-temple-400">Bio</h4>
                    <p className="text-sm text-temple-700 whitespace-pre-wrap">{detail.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase text-temple-400">Pricing</h4>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="rounded bg-temple-50 p-2 text-center">
                      <p className="text-[10px] text-temple-500 uppercase">Hourly</p>
                      <p className="text-sm font-bold text-temple-700">{formatINR(detail.hourlyPricePaise)}</p>
                    </div>
                    <div className="rounded bg-temple-50 p-2 text-center">
                      <p className="text-[10px] text-temple-500 uppercase">Half Day</p>
                      <p className="text-sm font-bold text-temple-700">{formatINR(detail.halfDayPricePaise)}</p>
                    </div>
                    <div className="rounded bg-temple-50 p-2 text-center">
                      <p className="text-[10px] text-temple-500 uppercase">Full Day</p>
                      <p className="text-sm font-bold text-temple-700">{formatINR(detail.fullDayPricePaise)}</p>
                    </div>
                  </div>
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
                <textarea className="input h-20" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide feedback to the guide..." />
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

export default function AdminGuidesPage() {
  return (
    <Suspense fallback={null}>
      <Guides />
    </Suspense>
  );
}
