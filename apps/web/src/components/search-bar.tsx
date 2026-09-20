'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function SearchBar() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(isoPlus(1));
  const [checkOut, setCheckOut] = useState(isoPlus(3));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [q, setQ] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests), rooms: String(rooms) });
    if (q.trim()) params.set('q', q.trim());
    router.push(`/hotels?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="card grid grid-cols-2 gap-3 p-4 text-temple-900 md:grid-cols-5">
      <div className="col-span-2 md:col-span-1">
        <label className="label">Search</label>
        <input className="input" placeholder="Hotel / area" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div>
        <label className="label">Check-in</label>
        <input type="date" className="input" min={isoPlus(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      </div>
      <div>
        <label className="label">Check-out</label>
        <input type="date" className="input" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
      </div>
      <div>
        <label className="label">Guests</label>
        <select className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
          {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n} guest{n>1?'s':''}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <button className="btn-gold w-full py-3">🔍 Search Stays</button>
      </div>
      <input type="hidden" name="rooms" value={rooms} />
    </form>
  );
}
