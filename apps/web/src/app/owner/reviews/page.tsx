'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';

type Review = {
  id: string; overall: number; comment: string | null; response: string | null;
  createdAt: string; customerName?: string; customer?: { name: string };
  hotel?: { name: string };
};

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<{ reviews: Review[] }>('/api/owner/reviews', true).then((r) => setReviews(r.reviews)).catch(() => {});
  }, []);

  async function respond(id: string) {
    const response = drafts[id];
    if (!response?.trim()) return;
    await api.post(`/api/owner/reviews/${id}/response`, { response }, true);
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, response } : r)));
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-temple-700">Guest reviews</h1>
      {reviews.length === 0 && <p className="card mt-4 p-6 text-temple-500">No reviews yet — they appear after guests complete their stay.</p>}
      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-temple-700">{r.customer?.name ?? r.customerName ?? 'Guest'}</span>
              <span className="badge bg-gold-100 text-gold-800">{'★'.repeat(r.overall)}{'☆'.repeat(5 - r.overall)}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-temple-400">{fmtDate(r.createdAt)}{r.hotel ? ` · ${r.hotel.name}` : ''}</p>
            {r.comment && <p className="mt-2 text-sm text-temple-600">{r.comment}</p>}
            {r.response ? (
              <p className="mt-3 rounded-lg bg-temple-50 p-3 text-sm text-temple-600">
                <strong>Your response:</strong> {r.response}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="Thank the guest or clarify politely…"
                  value={drafts[r.id] ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} />
                <button onClick={() => respond(r.id)} className="btn-primary text-xs">Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
