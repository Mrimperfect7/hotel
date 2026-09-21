'use client';

import Link from 'next/link';
import { SearchBar } from '@/components/search-bar';
import { TEMPLE_DISTANCE_BANDS } from '@gsv/types';
import { MapPin, Footprints, Zap, Star, Castle, Bell } from 'lucide-react';

const NADA_GATES = [
  { name: 'Kizhakke Nada (East)', query: 'East Nada', desc: 'Main Temple Entrance' },
  { name: 'Padinjare Nada (West)', query: 'West Nada', desc: 'Chuttambalam Gate' },
  { name: 'Thekke Nada (South)', query: 'South Nada', desc: 'Peaceful & Close' },
  { name: 'Vadakke Nada (North)', query: 'North Nada', desc: 'Family Stays' },
];

const STATS = [
  { value: '40+', label: 'Verified Stays', icon: <Castle className="h-5 w-5 text-gold-400" /> },
  { value: '150m', label: 'Avg Nada Walk', icon: <Footprints className="h-5 w-5 text-gold-400" /> },
  { value: '0%', label: 'Extra Platform Fee', icon: <Zap className="h-5 w-5 text-gold-400" /> },
  { value: '4.9★', label: 'Devotee Rating', icon: <Star className="h-5 w-5 text-gold-400" /> },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[680px] overflow-hidden bg-gradient-to-b from-temple-900 via-temple-950 to-temple-900 text-white">
      {/* Static Background Image */}
      <img src="/hero-temple.jpg" alt="Guruvayoor Temple" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />

      {/* Atmospheric Lighting Gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            'radial-gradient(circle at 85% 35%, rgba(223, 169, 44, 0.45) 0, transparent 45%), radial-gradient(circle at 15% 75%, rgba(43, 85, 151, 0.5) 0, transparent 50%)',
        }}
      />

      {/* Traditional Temple Arch Pattern Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'radial-gradient(#dfa92c 1.5px, transparent 1.5px), radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 md:pt-14 md:pb-20 lg:px-8">
        {/* Top Ticker: Live Guruvayoor Temple Darshan Schedule */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/25 bg-gradient-to-r from-temple-900/90 via-temple-800/80 to-temple-900/90 px-4 py-2 text-xs backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-gold-300">Guruvayoor Sri Krishna Temple Darshan:</span>
            <span className="text-temple-100 hidden sm:inline">Nirmalyam 3:00 AM • Usha Pooja 6:30 AM • Deeparadhana 6:30 PM</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-temple-200">
            <span className="hidden md:inline">Kerala Temple Code Followed</span>
            <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 font-bold text-gold-300 ring-1 ring-gold-400/40">
              Direct Owner Rates
            </span>
          </div>
        </div>

        {/* Main 1-Column Hero Grid */}
        <div className="flex flex-col items-start gap-12 lg:gap-8">
          {/* Left Column: Heading, Value Prop, Search, Filters */}
          <div className="max-w-3xl">
            {/* Sacred Location Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-500/15 px-3.5 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
              <Castle className="h-4 w-4" />
              <span>Namma Guruvayoor</span>
              <span className="text-gold-500">•</span>
              <span className="text-temple-100">Thrissur, Kerala</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.12]">
              Stay Steps From{' '}
              <span className="block bg-gradient-to-r from-gold-200 via-amber-300 to-gold-400 bg-clip-text text-transparent">
                Guruvayoor Temple
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 max-w-2xl text-base text-temple-100 sm:text-lg leading-relaxed">
              Verified hotels, traditional illams, and comfortable devotee homestays. Walk to early
              morning Nirmalyam darshan without peak taxi surges. Direct booking with the property.
            </p>

            {/* Glassmorphic Search Bar */}
            <div className="mt-8 max-w-2xl rounded-3xl border border-gold-400/30 bg-temple-900/60 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
              <SearchBar />
            </div>

            {/* Temple Nada Gate Quick Filters */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-300/80 mb-2">
                Popular Nada Gates & Distance:
              </p>
              <div className="flex flex-wrap gap-2">
                {NADA_GATES.map((gate) => (
                  <Link
                    key={gate.name}
                    href={`/hotels?q=${encodeURIComponent(gate.query)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-temple-100 backdrop-blur-sm transition-all hover:border-gold-400/50 hover:bg-gold-400/10 hover:text-white"
                  >
                    <MapPin className="h-3.5 w-3.5 text-gold-400" />
                    <span>{gate.name}</span>
                  </Link>
                ))}

                {TEMPLE_DISTANCE_BANDS.slice(0, 3).map((b) => (
                  <Link
                    key={b.key}
                    href={`/hotels?band=${b.key}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-gold-400/25 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-200 backdrop-blur-sm transition-all hover:bg-gold-400/20"
                  >
                    <Footprints className="h-3.5 w-3.5 text-gold-400" />
                    <span>{b.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust & Live Metrics Strip */}
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{stat.icon}</span>
                    <span className="font-display text-xl font-bold text-white">{stat.value}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-temple-200">{stat.label}</div>
                </div>
              ))}
            </div>

        </div>
      </div>
    </section>
  );
}
