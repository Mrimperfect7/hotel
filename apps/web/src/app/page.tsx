'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { HotelCard, type HotelCardData } from '@/components/hotel-card';
import { HeroSection } from '@/components/hero-section';

const COLLECTIONS = [
  { href: '/collections/pilgrims', icon: '🛕', title: 'For Pilgrims', desc: 'Early darshan friendly stays' },
  { href: '/collections/families', icon: '👨‍👩‍👧', title: 'For Families', desc: 'Family rooms & home food' },
  { href: '/collections/budget', icon: '🪙', title: 'Budget Stays', desc: 'Clean rooms under ₹1,500' },
  { href: '/collections/ac', icon: '❄️', title: 'AC Rooms', desc: 'Beat the Kerala humidity' },
  { href: '/collections/parking', icon: '🅿️', title: 'With Parking', desc: 'Safe car & bike parking' },
  { href: '/collections/couples', icon: '💑', title: 'Couple Friendly', desc: 'Verified & welcoming' },
];

const SERVICES = [
  { href: '/hotels', icon: '🏨', title: 'Stay', desc: 'Find hotels near Guruvayoor Temple' },
  { href: '/guides', icon: '🧑‍🏫', title: 'Guide', desc: 'Hire a verified local guide' },
  { href: '/rides', icon: '🚕', title: 'Ride', desc: 'Book local transportation' },
  { href: '/food', icon: '🍛', title: 'Food', desc: 'Discover and order food nearby' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<HotelCardData[]>([]);
  const [nearest, setNearest] = useState<HotelCardData[]>([]);

  useEffect(() => {
    api.get<{ hotels: HotelCardData[] }>('/api/hotels?limit=4&sort=rating').then((r) => setFeatured(r.hotels)).catch(() => {});
    api.get<{ hotels: HotelCardData[] }>('/api/hotels?limit=3&sort=nearest').then((r) => setNearest(r.hotels)).catch(() => {});
  }, []);

  return (
    <div>
      {/* 3D Animated Hero */}
      <HeroSection />

      <div className="arch-divider" />

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="font-display text-2xl font-bold text-temple-700 text-center">Everything You Need for Your Guruvayoor Trip</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {SERVICES.map((c) => (
            <Link key={c.href} href={c.href} className="card p-6 text-center transition hover:-translate-y-1 hover:shadow-lg bg-white border border-temple-100">
              <div className="text-4xl mb-3">{c.icon}</div>
              <div className="text-lg font-bold text-temple-800">{c.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-temple-500">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-temple-700">Browse by need</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {COLLECTIONS.map((c) => (
            <Link key={c.href} href={c.href} className="card p-4 text-center transition hover:shadow-lift">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-2 text-sm font-bold text-temple-700">{c.title}</div>
              <div className="mt-1 text-[11px] leading-snug text-temple-400">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-temple-700">Top rated stays</h2>
            <Link href="/hotels?sort=rating" className="text-sm font-semibold text-gold-600">View all →</Link>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((h) => <HotelCard key={h.id} hotel={h} />)}
          </div>
          {featured.length === 0 && (
            <p className="mt-6 rounded-xl bg-temple-50 p-6 text-center text-sm text-temple-500">
              No hotels published yet — approved stays will appear here. 🛕
            </p>
          )}
        </div>
      </section>

      {/* Nearest to temple */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-temple-700">Closest to the temple</h2>
            <p className="text-sm text-temple-500">Wake up with the gongs — walk to darshan in minutes.</p>
          </div>
          <Link href="/hotels?sort=nearest" className="text-sm font-semibold text-gold-600">See all →</Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {nearest.map((h) => <HotelCard key={h.id} hotel={h} />)}
        </div>
      </section>

      {/* Owner CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 mt-8">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-r from-temple-600 to-temple-700 p-8 text-center text-white md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">Provide a service in Guruvayoor?</h2>
            <p className="mt-2 text-temple-100">
              List your hotel, guide service, taxi, or restaurant free. Join the complete Guruvayoor travel platform.
            </p>
          </div>
          <Link href="/list-your-service" className="btn-gold px-6 py-3 text-base">Join as Partner →</Link>
        </div>
      </section>
    </div>
  );
}
