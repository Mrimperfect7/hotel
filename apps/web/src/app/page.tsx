import Link from 'next/link';
import { HotelCard, type HotelCardData } from '@/components/hotel-card';
import { HeroSection } from '@/components/hero-section';
import { Castle, Users, Coins, Snowflake, Car, Heart, Building2, Map, Utensils } from 'lucide-react';

const COLLECTIONS = [
  { href: '/collections/pilgrims', icon: <Castle className="w-8 h-8 text-gold-500 mx-auto" />, title: 'For Pilgrims', desc: 'Early darshan friendly stays' },
  { href: '/collections/families', icon: <Users className="w-8 h-8 text-gold-500 mx-auto" />, title: 'For Families', desc: 'Family rooms & home food' },
  { href: '/collections/budget', icon: <Coins className="w-8 h-8 text-gold-500 mx-auto" />, title: 'Budget Stays', desc: 'Clean rooms under ₹1,500' },
  { href: '/collections/ac', icon: <Snowflake className="w-8 h-8 text-gold-500 mx-auto" />, title: 'AC Rooms', desc: 'Beat the Kerala humidity' },
  { href: '/collections/parking', icon: <Car className="w-8 h-8 text-gold-500 mx-auto" />, title: 'With Parking', desc: 'Safe car & bike parking' },
  { href: '/collections/couples', icon: <Heart className="w-8 h-8 text-gold-500 mx-auto" />, title: 'Couple Friendly', desc: 'Verified & welcoming' },
];

const SERVICES = [
  { href: '/hotels', icon: <Building2 className="w-10 h-10 text-gold-500 mx-auto" />, title: 'Stay', desc: 'Find hotels near Guruvayoor Temple' },
  { href: '/guides', icon: <Map className="w-10 h-10 text-gold-500 mx-auto" />, title: 'Guide', desc: 'Hire a verified local guide' },
  { href: '/rides', icon: <Car className="w-10 h-10 text-gold-500 mx-auto" />, title: 'Ride', desc: 'Book local transportation' },
  { href: '/food', icon: <Utensils className="w-10 h-10 text-gold-500 mx-auto" />, title: 'Food', desc: 'Discover and order food nearby' },
];

async function getHotels(query: string) {
  try {
    const api = process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:4000';
    const res = await fetch(`${api}/api/hotels?${query}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hotels || []) as HotelCardData[];
  } catch (e) {
    return [];
  }
}

export default async function HomePage() {
  const [featured, nearest] = await Promise.all([
    getHotels('limit=4&sort=rating'),
    getHotels('limit=3&sort=nearest')
  ]);

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
            <Link key={c.href} href={c.href} className="card p-6 text-center transition hover:-translate-y-1 hover:shadow-lg bg-white border border-temple-100 flex flex-col items-center justify-center">
              <div className="mb-3">{c.icon}</div>
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
            <Link key={c.href} href={c.href} className="card p-4 text-center transition hover:shadow-lift flex flex-col items-center justify-center">
              <div className="mb-2">{c.icon}</div>
              <div className="text-sm font-bold text-temple-700">{c.title}</div>
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
              No hotels published yet — approved stays will appear here.
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

      {/* Plan Trip Floating CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/plan-trip" className="btn-gold shadow-2xl py-4 px-6 text-lg rounded-full animate-bounce">
          PLAN MY TRIP 🛕
        </Link>
      </div>
    </div>
  );
}
