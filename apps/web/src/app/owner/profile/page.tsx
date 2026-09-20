'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { statusTone, distanceLabel } from '@/lib/format';

type Hotel = {
  id: string; name: string; status: string; description: string | null;
  addressLine1: string; city: string; pincode: string;
  checkInTime: string; checkOutTime: string;
  cancellationPolicyText: string; hotelRules: string | null;
  contactPhone: string; whatsapp: string | null; distanceMeters: number | null;
};

export default function OwnerProfilePage() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<{ hotels: Hotel[] }>('/api/owner/hotels', true)
      .then((r) => setHotel(r.hotels[0] ?? null))
      .catch(() => {});
  }, []);

  if (!hotel) return <p className="text-temple-500">Loading profile…</p>;

  function edit(patch: Partial<Hotel>) { setHotel({ ...hotel!, ...patch }); }

  async function save() {
    await api.patch(`/api/owner/hotels/${hotel!.id}/profile`, {
      description: hotel!.description, hotelRules: hotel!.hotelRules,
      cancellationPolicyText: hotel!.cancellationPolicyText,
      contactPhone: hotel!.contactPhone, whatsapp: hotel!.whatsapp,
      checkInTime: hotel!.checkInTime, checkOutTime: hotel!.checkOutTime,
    }, true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-temple-700">Hotel profile</h1>

      <div className={`card mt-4 flex items-center justify-between p-4 ${hotel.status !== 'APPROVED' ? 'ring-1 ring-gold-300' : ''}`}>
        <div>
          <span className={`badge ${statusTone(hotel.status)}`}>{hotel.status}</span>
          {hotel.status !== 'APPROVED' && (
            <p className="mt-1 text-xs text-gold-800">
              Your property is currently under admin verification — bookable after approval.
            </p>
          )}
        </div>
        {hotel.distanceMeters != null && (
          <span className="badge bg-kerala-100 text-kerala-700">🛕 {distanceLabel(hotel.distanceMeters)} from temple</span>
        )}
      </div>

      <div className="card mt-4 space-y-3 p-5">
        <div><label className="label">Hotel name (admin-managed)</label><input className="input" value={hotel.name} disabled /></div>
        <div><label className="label">Address</label><input className="input" value={`${hotel.addressLine1}, ${hotel.city} ${hotel.pincode}`} disabled /></div>
        <div><label className="label">Description</label><textarea className="input h-24" value={hotel.description ?? ''} onChange={(e) => edit({ description: e.target.value })} /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><label className="label">Check-in</label><input className="input" value={hotel.checkInTime} onChange={(e) => edit({ checkInTime: e.target.value })} /></div>
          <div><label className="label">Check-out</label><input className="input" value={hotel.checkOutTime} onChange={(e) => edit({ checkOutTime: e.target.value })} /></div>
          <div><label className="label">Contact phone</label><input className="input" value={hotel.contactPhone} onChange={(e) => edit({ contactPhone: e.target.value })} /></div>
          <div><label className="label">WhatsApp</label><input className="input" value={hotel.whatsapp ?? ''} onChange={(e) => edit({ whatsapp: e.target.value })} /></div>
        </div>
        <div><label className="label">Cancellation policy text</label><textarea className="input h-20" value={hotel.cancellationPolicyText} onChange={(e) => edit({ cancellationPolicyText: e.target.value })} /></div>
        <div><label className="label">Hotel rules</label><textarea className="input h-24" value={hotel.hotelRules ?? ''} onChange={(e) => edit({ hotelRules: e.target.value })} /></div>
        <div className="flex items-center gap-3">
          <button onClick={save} className="btn-primary">Save profile</button>
          {saved && <span className="badge bg-kerala-100 text-kerala-700">Saved ✓</span>}
        </div>
      </div>
    </div>
  );
}
