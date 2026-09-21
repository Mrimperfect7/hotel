'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type DayRow = {
  date: string;
  rooms: Array<{ roomTypeId: string; name: string; sellable: number; booked: number; blocked: number; available: number }>;
};

export default function OwnerAvailabilityPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState<DayRow[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [editBlock, setEditBlock] = useState<{ date: string; roomTypeId: string; roomName: string; current: number; sellable: number } | null>(null);
  const [blockCount, setBlockCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!hotelId) return;
    api.get<{ days: DayRow[] }>(`/api/owner/availability?hotelId=${hotelId}&month=${month}`, true)
      .then((r) => setDays(r.days))
      .catch(() => {});
  };

  useEffect(() => {
    api.get<{ hotels: Array<{ id: string; name: string; status: string }> }>('/api/owner/hotels', true)
      .then((r) => {
        if (r.hotels.length === 0) { setError('No property yet — register one from “List Your Hotel”.'); return; }
        setHotelId(r.hotels[0]!.id);
      })
      .catch(() => setError('Could not load your property.'));
  }, []);

  useEffect(load, [hotelId, month]);

  const roomNames = days[0]?.rooms.map((r) => r.name) ?? [];

  async function saveBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!hotelId || !editBlock) return;
    setBusy(true);
    try {
      await api.post('/api/owner/availability/block', {
        hotelId,
        roomTypeId: editBlock.roomTypeId,
        date: editBlock.date,
        blockedCount: blockCount,
      }, true);
      setEditBlock(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Error saving block');
    } finally {
      setBusy(false);
    }
  }

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
                      <button 
                        onClick={() => {
                          setEditBlock({ date: d.date, roomTypeId: r.roomTypeId, roomName: r.name, current: r.blocked, sellable: r.sellable });
                          setBlockCount(r.blocked);
                        }}
                        className={`inline-block w-full rounded-md px-2 py-1 font-semibold hover:opacity-80 transition-opacity ${
                        r.available === 0 ? 'bg-red-100 text-red-700'
                        : r.available <= 2 ? 'bg-gold-100 text-gold-800'
                        : 'bg-kerala-100 text-kerala-700'}`}>
                        {r.available}/{r.sellable}
                        {r.blocked > 0 && <span className="block text-[9px] text-red-600 opacity-80">({r.blocked} blocked)</span>}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-temple-400">Available / sellable per room type. Red = sold out, gold = almost full. Click a cell to block inventory.</p>
        </div>
      )}

      {editBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={saveBlock} className="card w-full max-w-sm p-6 shadow-2xl">
            <h2 className="font-bold text-temple-900">Block Inventory (No Vacancy)</h2>
            <p className="mt-1 text-sm text-temple-500">{editBlock.roomName} on {editBlock.date}</p>
            
            <div className="mt-4">
              <label className="label">Rooms to block</label>
              <input type="number" min="0" max={editBlock.sellable} required className="input" value={blockCount} onChange={(e) => setBlockCount(Number(e.target.value))} />
              <p className="text-[11px] text-temple-400 mt-1">Set to 0 to remove block. Max blockable is {editBlock.sellable}.</p>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditBlock(null)} className="btn bg-temple-100 text-temple-700">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving...' : 'Save Block'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
