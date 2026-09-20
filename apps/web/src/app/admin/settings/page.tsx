'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Settings = {
  platformName: string; commissionBps: number; bookingFeePaise: number;
  maxHotelDistanceMeters: number; featuredHotelIds: string[];
};

export default function AdminSettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ settings: Settings }>('/api/admin/settings', true).then((r) => setS(r.settings)).catch(() => {});
  }, []);

  if (!s) return <p className="text-temple-500">Loading settings…</p>;

  async function save() {
    await api.patch('/api/admin/settings', {
      platformName: s!.platformName,
      commissionBps: s!.commissionBps,
      bookingFeePaise: s!.bookingFeePaise,
      maxHotelDistanceMeters: s!.maxHotelDistanceMeters,
    }, true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold text-temple-700">Business settings</h1>
      <div className="card mt-4 space-y-4 p-5">
        <div>
          <label className="label">Platform name</label>
          <input className="input" value={s.platformName} onChange={(e) => setS({ ...s!, platformName: e.target.value })} />
        </div>
        <div>
          <label className="label">Default commission (%)</label>
          <input className="input" type="number" step="0.5" min="0" max="50"
            value={s.commissionBps / 100}
            onChange={(e) => setS({ ...s!, commissionBps: Math.round(Number(e.target.value) * 100) })} />
          <p className="mt-1 text-xs text-temple-400">
            Applied to room subtotal (pre-tax). Example: ₹2,000 room at {s.commissionBps / 100}% → hotel receives ₹{2000 - (2000 * s.commissionBps) / 10000 * 100}, platform earns ₹{(2000 * s.commissionBps) / 1000000 * 100}. Individual hotels can have an override.
          </p>
        </div>
        <div>
          <label className="label">Booking fee (₹, charged to guest)</label>
          <input className="input" type="number" min="0"
            value={s.bookingFeePaise / 100}
            onChange={(e) => setS({ ...s!, bookingFeePaise: Math.round(Number(e.target.value) * 100) })} />
        </div>
        <div>
          <label className="label">Maximum hotel distance from temple (m)</label>
          <input className="input" type="number" min="100" max="50000"
            value={s.maxHotelDistanceMeters}
            onChange={(e) => setS({ ...s!, maxHotelDistanceMeters: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={save} className="btn-primary">Save settings</button>
          {saved && <span className="badge bg-kerala-100 text-kerala-700">Saved — changes apply to new bookings ✓</span>}
        </div>
      </div>
    </div>
  );
}
