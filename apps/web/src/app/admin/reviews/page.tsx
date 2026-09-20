'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';

type Review = {
  id: string; overall: number; comment: string | null; status: string; createdAt: string;
  customer?: { name: string } | null; hotel?: { name: string };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const load = useCallback(() => {
    api.get<{ reviews: Review[] }>('/api/admin/reviews', true).then((r) => setReviews(r.reviews)).catch(() => {});
  }, []);

  useEffect(load, [load]);

  async function set(id: string, status: string) {
    await api.patch(`/api/admin/reviews/${id}`, { status }, true);
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-temple-700">Reviews moderation</h1>
      <div className="mt-4 space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-temple-700">{r.customer?.name ?? 'Guest'}</span>
                <span className="text-xs text-temple-400"> on {r.hotel?.name}</span>
              </div>
              <span className="badge bg-gold-100 text-gold-800">{'★'.repeat(r.overall)}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-temple-600">{r.comment}</p>}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-temple-400">{fmtDate(r.createdAt)}</span>
              <div className="flex items-center gap-2">
                <span className={`badge ${r.status === 'PUBLISHED' ? 'bg-kerala-100 text-kerala-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                {r.status === 'PUBLISHED' ? (
                  <button onClick={() => set(r.id, 'HIDDEN')} className="btn bg-red-50 px-3 py-1 text-xs text-red-600">Hide</button>
                ) : (
                  <button onClick={() => set(r.id, 'PUBLISHED')} className="btn bg-kerala-500 px-3 py-1 text-xs text-white">Publish</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="card p-6 text-temple-500">No reviews yet.</p>}
      </div>
    </div>
  );
}
