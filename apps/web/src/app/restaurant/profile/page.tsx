'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Utensils,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Save,
  Truck
} from 'lucide-react';

type RestaurantData = {
  id: string;
  name: string;
  phone: string;
  address: string;
  cuisine: string[];
  openingHours?: string | null;
  deliveryAvailable: boolean;
  status: string;
};

type Dash = {
  restaurant: RestaurantData;
};

const CUISINE_OPTIONS = [
  'Pure Vegetarian',
  'Traditional Kerala Sadhya',
  'South Indian Tiffin',
  'North Indian',
  'Temple Prasadam',
  'Tea & Evening Snacks',
  'Payasam Special'
];

function RestaurantProfileContent() {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cuisines, setCuisines] = useState<string[]>(['Pure Vegetarian', 'Traditional Kerala Sadhya']);
  const [openingHours, setOpeningHours] = useState('06:00 AM - 10:00 PM');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  const loadProfile = () => {
    setLoading(true);
    api
      .get<Dash>('/api/food/dashboard', true)
      .then((res) => {
        if (res.restaurant) {
          const r = res.restaurant;
          setRestaurant(r);
          setName(r.name || '');
          setPhone(r.phone || '');
          setAddress(r.address || '');
          setCuisines(r.cuisine?.length ? r.cuisine : ['Pure Vegetarian', 'Traditional Kerala Sadhya']);
          setOpeningHours(r.openingHours || '06:00 AM - 10:00 PM');
          setDeliveryAvailable(r.deliveryAvailable ?? true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleCuisine = (c: string) => {
    setCuisines((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.patch(
        '/api/food/profile',
        {
          name,
          phone,
          address,
          cuisine: cuisines,
          openingHours,
          deliveryAvailable,
        },
        true
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Error saving restaurant profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !restaurant) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  const isApproved = restaurant?.status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <Utensils className="w-7 h-7 text-gold-600" /> Restaurant Settings & Profile
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Configure restaurant contact information, opening timings, and food delivery availability.
          </p>
        </div>
        <Link href="/restaurant" className="btn-outline text-xs py-2 px-3">
          ← Back to Kitchen Display
        </Link>
      </div>

      {/* Status banner */}
      <div
        className={`card p-4 flex items-center justify-between gap-4 ${
          isApproved
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-gold-300 bg-gold-50 text-gold-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isApproved ? (
            <Shield className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-gold-600 shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">
              Restaurant Listing: {restaurant?.status || 'PENDING'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isApproved
                ? 'Your restaurant is live on Namma Guruvayoor Food. Devotees can view your menu and place food orders.'
                : 'Your restaurant listing is pending admin verification.'}
            </p>
          </div>
        </div>
        <span
          className={`badge font-bold px-3 py-1 ${
            isApproved ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-white'
          }`}
        >
          {restaurant?.status || 'PENDING'}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-gold-600" /> Restaurant Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Restaurant Display Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Guruvayoor Brahmin's Cafe"
                required
              />
            </div>

            <div>
              <label className="label">Order Hotline / WhatsApp</label>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Address / Location</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near East Nada Temple Gate, Guruvayoor, Kerala 680101"
                required
              />
            </div>
          </div>
        </div>

        {/* Timings & Delivery */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-600" /> Operations & Delivery
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Service Timings</label>
              <input
                className="input"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="06:00 AM - 10:00 PM"
              />
              <span className="text-[11px] text-temple-400">
                Shown to devotees ordering temple breakfast and dinner.
              </span>
            </div>

            <div>
              <label className="label">Delivery Service</label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryAvailable(!deliveryAvailable)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    deliveryAvailable ? 'bg-kerala-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      deliveryAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-temple-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-temple-500" />
                  {deliveryAvailable ? 'Delivery Active to Hotels & Lodges' : 'Dine-in / Pickup Only'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuisines */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <span className="text-xl">🥗</span> Food Cuisines & Tags
          </h2>

          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((c) => {
              const active = cuisines.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCuisine(c)}
                  className={`badge px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-temple-600 text-white shadow-sm ring-1 ring-temple-600'
                      : 'bg-white text-temple-600 ring-1 ring-temple-200 hover:bg-temple-50'
                  }`}
                >
                  {active ? '✓ ' : '+ '} {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Settings updated successfully!
            </p>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Restaurant Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RestaurantProfilePage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <RestaurantProfileContent />
    </Suspense>
  );
}
