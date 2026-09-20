'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type DayRow = {
  date: string;
  rooms: Array<{ roomTypeId: string; name: string; sellable: number; booked: number; available: number }>;
};

export default function OwnerAvailabilityPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState<DayRow[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ hotels: Array<{ id: string; name: string; status: string }> }>('/api/owner/hotels', true)
      .then((r) => {
        if (r.hotels.length === 0) { setError('No property yet — register one from “List Your Hotel”.'); return; }
        setHotelId(r.hotels[0]!.id);
      })
      .catch(() => setError('Could not load your property.'));
  }, []);

  useEffect(() => {
    if (!hotelId) return;
    api.get<{ days: DayRow[] }>(`/api/owner/availability?hotelId=${hotelId}&month=${month}`, true)
      .then((r) => setDays(r.days))
      .catch(() => {});
  }, [hotelId, month]);

  const roomNames = days[0]?.rooms.map((r) => r.name) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-temple-700">Availability calendar</h1>
        <input type="month" className="input w-auto" value={month}
          onChange={(e) => setMonth(e.target.value)} />
      </div>
      {error && <p className="card mt-4 p-4 text-sm text-temple-500">{error}</p>}
      {days.length > 0 && (
        <div className="card mt-4 overflow-x-auto p-4">
          <table className="w-full min-w-[640px] text-center text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-temple-400">Date</th>
                {roomNames.map((n) => <th key={n} className="p-2 text-temple-600">{n}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date} className={d.date === new Date().toISOString().slice(0, 10) ? 'bg-gold-50' : ''}>
                  <td className="p-2 text-left font-mono text-temple-500">{d.date.slice(8)}</td>
                  {d.rooms.map((r) => (
                    <td key={r.roomTypeId} className="p-1">
                      <span className={`inline-block w-14 rounded-md px-2 py-1 font-semibold ${
                        r.available === 0 ? 'bg-red-100 text-red-700'
                        : r.available <= 2 ? 'bg-gold-100 text-gold-800'
                        : 'bg-kerala-100 text-kerala-700'}`}>
                        {r.available}/{r.sellable}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-temple-400">Available / sellable per room type. Red = sold out, gold = almost full.</p>
        </div>
      )}
    </div>
  );
}
