'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError, getToken } from '@/lib/api';

const STEPS = ['Owner', 'Property', 'Location', 'Rooms', 'Amenities', 'Pricing', 'Photos', 'Documents', 'Bank', 'Submit'];

const AMENITY_OPTIONS = [
  'wifi', 'ac', 'parking', 'breakfast', 'family_rooms', 'lift', 'couple_friendly',
  'hot_water', 'veg_food', 'temple_view', 'cctv', 'power_backup', 'laundry',
  'wheelchair', 'room_service', 'drinking_water',
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi', ac: 'Air Conditioning', parking: 'Parking', breakfast: 'Breakfast',
  family_rooms: 'Family Rooms', lift: 'Lift', couple_friendly: 'Couple Friendly',
  hot_water: '24×7 Hot Water', veg_food: 'Pure Veg Food', temple_view: 'Temple View',
  cctv: 'CCTV', power_backup: 'Power Backup', laundry: 'Laundry', wheelchair: 'Wheelchair Access',
  room_service: 'Room Service', drinking_water: 'Drinking Water',
};

export default function ListYourHotelPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ownerName: '', phone: '', whatsapp: '', email: '', gstin: '',
    name: '', description: '', addressLine1: '', pincode: '',
    lat: '10.5945', lng: '76.2075',
    rooms: [{ name: 'Deluxe AC Room', basePrice: '2000', maxOccupancy: '3', bedType: 'Queen', totalRooms: '5', acAvailable: true }],
    amenityKeys: ['wifi', 'hot_water'] as string[],
    checkInTime: '12:00', checkOutTime: '11:00',
    registrationDoc: '', gstDoc: '',
    accountName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await api.post('/api/hotels/register', {
        owner: { ownerName: form.ownerName, phone: form.phone, whatsapp: form.whatsapp || undefined, email: form.email, gstin: form.gstin || undefined },
        property: {
          name: form.name, description: form.description || undefined, addressLine1: form.addressLine1,
          pincode: form.pincode, checkInTime: form.checkInTime, checkOutTime: form.checkOutTime,
          contactPhone: form.phone, contactEmail: form.email,
          refundPolicy: 'MODERATE',
        },
        location: { lat: Number(form.lat), lng: Number(form.lng) },
        rooms: form.rooms.map((r) => ({
          name: r.name, basePrice: Number(r.basePrice), maxOccupancy: Number(r.maxOccupancy),
          bedType: r.bedType, totalRooms: Number(r.totalRooms), acAvailable: r.acAvailable,
        })),
        amenityKeys: form.amenityKeys,
        documents: [
          ...(form.registrationDoc ? [{ docType: 'registration', url: form.registrationDoc }] : []),
          ...(form.gstDoc ? [{ docType: 'gst', url: form.gstDoc }] : []),
        ],
        bank: { accountName: form.accountName, accountNumber: form.accountNumber, ifsc: form.ifsc, bankName: form.bankName, upiId: form.upiId || undefined },
      }, true);
      router.push('/owner?submitted=1');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Please sign in with a Hotel Owner account first (registration is free).');
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-3xl font-bold text-temple-700">List Your Hotel on Guruvayoor Stay</h1>
        <p className="mt-3 text-temple-600">
          Reach thousands of pilgrims and families visiting Guruvayoor Sri Krishna Temple. Bookings go
          directly to you — confirm, decline or contact guests from your dashboard or phone.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ['🛕', 'Pilgrim-first demand', 'Guests searching specifically for stays near the temple'],
            ['✅', 'Verification builds trust', 'Our team verifies your property — a badge guests look for'],
            ['📊', 'You stay in control', 'Real-time room availability, pricing and instant booking alerts'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="card p-5">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-2 font-bold text-temple-700">{title}</h3>
              <p className="mt-1 text-sm text-temple-500">{desc}</p>
            </div>
          ))}
        </div>
        <div className="card mt-6 bg-gold-50 p-5 text-sm text-gold-800">
          To register a property you need a <strong>Hotel Owner account</strong> (free).{' '}
          {getToken()
            ? 'You are signed in — start the wizard below.'
            : <Link href="/register" className="font-bold underline">Create an owner account →</Link>}
        </div>
        <button onClick={() => setStarted(true)} className="btn-gold mt-6 px-8 py-3 text-base">Start registration →</button>
      </div>
    );
  }

  const canNext =
    (step === 0 && form.ownerName && form.phone && form.email) ||
    (step === 1 && form.name && form.addressLine1 && form.pincode.length === 6) ||
    step === 2 || (step === 3 && form.rooms.length > 0) ||
    (step === 8 && form.accountName && form.accountNumber && form.ifsc && form.bankName) ||
    true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Stepper */}
      <ol className="flex flex-wrap gap-1.5 text-[11px]">
        {STEPS.map((s, i) => (
          <li key={s} className={`badge ${i === step ? 'bg-temple-600 text-white' : i < step ? 'bg-kerala-100 text-kerala-700' : 'bg-white text-temple-400 ring-1 ring-temple-200'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="card mt-5 space-y-4 p-6">
        {step === 0 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Owner information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Owner name</label><input className="input" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
              <div><label className="label">WhatsApp</label><input className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div><label className="label">GSTIN (optional)</label><input className="input" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} /></div>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Property information</h2>
            <div><label className="label">Hotel name</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="label">Description</label><textarea className="input h-24" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Address</label><input className="input" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} /></div>
              <div><label className="label">Pincode</label><input className="input" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} /></div>
              <div><label className="label">Check-in time</label><input className="input" value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} /></div>
              <div><label className="label">Check-out time</label><input className="input" value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} /></div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Location</h2>
            <p className="text-sm text-temple-500">
              Drop your location on Google Maps and paste the coordinates here — we calculate the distance
              to the temple automatically.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Latitude</label><input className="input" value={form.lat} onChange={(e) => set('lat', e.target.value)} /></div>
              <div><label className="label">Longitude</label><input className="input" value={form.lng} onChange={(e) => set('lng', e.target.value)} /></div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Rooms</h2>
            {form.rooms.map((r, i) => (
              <div key={i} className="card grid gap-3 p-4 md:grid-cols-3">
                <div><label className="label">Room name</label><input className="input" value={r.name} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, name: e.target.value }; set('rooms', rooms); }} /></div>
                <div><label className="label">Price / night (₹)</label><input className="input" type="number" value={r.basePrice} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, basePrice: e.target.value }; set('rooms', rooms); }} /></div>
                <div><label className="label">Total rooms</label><input className="input" type="number" value={r.totalRooms} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, totalRooms: e.target.value }; set('rooms', rooms); }} /></div>
                <div><label className="label">Bed type</label><input className="input" value={r.bedType} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, bedType: e.target.value }; set('rooms', rooms); }} /></div>
                <div><label className="label">Max guests</label><input className="input" type="number" value={r.maxOccupancy} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, maxOccupancy: e.target.value }; set('rooms', rooms); }} /></div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={r.acAvailable} onChange={(e) => { const rooms = [...form.rooms]; rooms[i] = { ...r, acAvailable: e.target.checked }; set('rooms', rooms); }} />
                  Air conditioned
                </label>
              </div>
            ))}
            <button type="button" className="btn-outline"
              onClick={() => set('rooms', [...form.rooms, { name: 'Standard Non-AC Room', basePrice: '1200', maxOccupancy: '2', bedType: 'Double', totalRooms: '3', acAvailable: false }])}>
              + Add another room type
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((key) => (
                <button key={key} type="button"
                  onClick={() => set('amenityKeys', form.amenityKeys.includes(key) ? form.amenityKeys.filter((k) => k !== key) : [...form.amenityKeys, key])}
                  className={`badge px-3 py-1.5 ${form.amenityKeys.includes(key) ? 'bg-temple-600 text-white' : 'bg-white text-temple-600 ring-1 ring-temple-200'}`}>
                  {AMENITY_LABELS[key] ?? key}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 5 && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-temple-700">Pricing</h2>
            <p className="text-sm text-temple-500">
              You set room prices in Step 3. Platform commission is transparent and configurable — shown in
              your owner dashboard for every booking.
            </p>
          </div>
        )}
        {step === 6 && (
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-temple-700">Photos</h2>
            <p className="text-sm text-temple-500">
              Upload hotel and room photos after verification approval via the owner dashboard (photo upload
              is verified to prevent misuse). For now, note any photo links here.
            </p>
          </div>
        )}
        {step === 7 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Documents</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Business registration link</label><input className="input" value={form.registrationDoc} onChange={(e) => set('registrationDoc', e.target.value)} /></div>
              <div><label className="label">GST certificate link (optional)</label><input className="input" value={form.gstDoc} onChange={(e) => set('gstDoc', e.target.value)} /></div>
            </div>
          </>
        )}
        {step === 8 && (
          <>
            <h2 className="font-display text-xl font-bold text-temple-700">Bank / payment information</h2>
            <p className="text-xs text-temple-400">Used only for your payouts. Never shown publicly.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Account holder</label><input className="input" value={form.accountName} onChange={(e) => set('accountName', e.target.value)} /></div>
              <div><label className="label">Account number</label><input className="input" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} /></div>
              <div><label className="label">IFSC</label><input className="input" value={form.ifsc} onChange={(e) => set('ifsc', e.target.value.toUpperCase())} /></div>
              <div><label className="label">Bank name</label><input className="input" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} /></div>
              <div><label className="label">UPI ID (optional)</label><input className="input" value={form.upiId} onChange={(e) => set('upiId', e.target.value)} /></div>
            </div>
          </>
        )}
        {step === 9 && (
          <div className="space-y-3 text-center">
            <div className="text-4xl">🛕</div>
            <h2 className="font-display text-xl font-bold text-temple-700">Ready to submit</h2>
            <p className="text-sm text-temple-500">
              Your property will go to admin verification. You will not receive public bookings until it is
              approved — this keeps guest trust high.
            </p>
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-between pt-2">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="btn-outline">← Back</button>
          {step < 9 ? (
            <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary">Next →</button>
          ) : (
            <button disabled={busy} onClick={submit} className="btn-gold">{busy ? 'Submitting…' : 'Submit for verification 🛕'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
