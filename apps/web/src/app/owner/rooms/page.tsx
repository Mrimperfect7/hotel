'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';

type Room = {
  id: string; name: string; basePricePaise: number; maxOccupancy: number;
  bedType: string; totalRooms: number; blockedRooms: number; acAvailable: boolean;
};

export default function OwnerRoomsPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ hotels: Array<{ id: string; roomTypes: Room[] }> }>('/api/owner/hotels', true)
      .then((r) => {
        if (r.hotels[0]) {
          setHotelId(r.hotels[0].id);
          setRooms(r.hotels[0].roomTypes);
        }
      })
      .catch(() => {});
  }, []);

  function edit(id: string, patch: Partial<Room>) {
    setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save(room: Room) {
    await api.patch(`/api/owner/rooms/${room.id}`, {
      basePrice: room.basePricePaise / 100,
      totalRooms: room.totalRooms,
      blockedRooms: room.blockedRooms,
      maxOccupancy: room.maxOccupancy,
      bedType: room.bedType,
      acAvailable: room.acAvailable,
    }, true);
    setSaved(room.id);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-temple-700">Rooms & pricing</h1>
      <p className="text-sm text-temple-500">
        Changes take effect immediately for new bookings. Existing bookings always honour the price at
        booking time.
      </p>
      {hotelId && (
        <button
          className="btn-outline mt-3 text-xs"
          onClick={async () => {
            const name = prompt('New room type name:');
            if (!name) return;
            const price = Number(prompt('Price per night (₹):') ?? '1500');
            await api.post(`/api/owner/hotels/${hotelId}/rooms`, { name, basePrice: price, totalRooms: 2, maxOccupancy: 2, bedType: 'Double', acAvailable: false }, true);
            window.location.reload();
          }}
        >
          + Add room type
        </button>
      )}

      <div className="mt-4 space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-temple-700">{room.name}</h3>
              {saved === room.id && <span className="badge bg-kerala-100 text-kerala-700">Saved ✓</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div>
                <label className="label">Price/night (₹)</label>
                <input className="input" type="number" value={room.basePricePaise / 100}
                  onChange={(e) => edit(room.id, { basePricePaise: Math.round(Number(e.target.value) * 100) })} />
              </div>
              <div>
                <label className="label">Total rooms</label>
                <input className="input" type="number" value={room.totalRooms}
                  onChange={(e) => edit(room.id, { totalRooms: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Blocked (maint.)</label>
                <input className="input" type="number" value={room.blockedRooms}
                  onChange={(e) => edit(room.id, { blockedRooms: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Max guests</label>
                <input className="input" type="number" value={room.maxOccupancy}
                  onChange={(e) => edit(room.id, { maxOccupancy: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Bed type</label>
                <input className="input" value={room.bedType}
                  onChange={(e) => edit(room.id, { bedType: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={room.acAvailable}
                  onChange={(e) => edit(room.id, { acAvailable: e.target.checked })} />
                Air conditioned
              </label>
              <button onClick={() => save(room)} className="btn-primary text-xs">Save changes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
