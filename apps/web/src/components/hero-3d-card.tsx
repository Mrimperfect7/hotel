'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface PreviewHotel {
  name: string;
  badge: string;
  nada: string;
  distance: string;
  walkTime: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tag: string;
  slug: string;
}

const PREVIEW_HOTELS: PreviewHotel[] = [
  {
    name: 'Sree Krishna Residency',
    badge: 'Devotee Favorite',
    nada: 'East Nada (Kizhakke Nada)',
    distance: '150m',
    walkTime: '2 min walk',
    price: 2200,
    rating: 4.9,
    reviews: 428,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    tag: 'Pure Veg · 24x7 Hot Water',
    slug: 'sree-krishna-residency',
  },
  {
    name: 'Temple Gate Inn',
    badge: 'Closest to Temple',
    nada: 'South Nada Gate',
    distance: '80m',
    walkTime: '1 min walk',
    price: 1800,
    rating: 4.8,
    reviews: 312,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    tag: 'Temple View · Early Check-in',
    slug: 'temple-gate-inn',
  },
  {
    name: 'Guruvayoor Grand',
    badge: 'Luxury Stays',
    nada: 'Railway Station Road',
    distance: '450m',
    walkTime: '5 min walk',
    price: 3100,
    rating: 4.9,
    reviews: 580,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    tag: 'Free Temple Shuttle · AC Suite',
    slug: 'guruvayoor-grand',
  },
];

export function Hero3DCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle through preview stays if not hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PREVIEW_HOTELS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    const rotX = (y - 0.5) * -22; // tilt angle degrees
    const rotY = (x - 0.5) * 22;

    setTilt({
      x: rotX,
      y: rotY,
      glareX: x * 100,
      glareY: y * 100,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
    setIsHovered(false);
  }, []);

  const hotel = PREVIEW_HOTELS[currentIndex];

  return (
    <div
      className="relative mx-auto w-full max-w-md select-none py-6"
      style={{ perspective: 1200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic 3D Floating Satellites (Rendered outside card in 3D perspective space) */}
      <div
        className="pointer-events-none absolute -top-1 -right-3 z-30 hidden sm:flex items-center gap-2 rounded-full border border-gold-300/40 bg-temple-900/80 px-3.5 py-1.5 text-xs font-semibold text-gold-200 shadow-xl backdrop-blur-md transition-transform duration-300"
        style={{
          transform: `translate3d(${tilt.y * 1.5}px, ${-tilt.x * 1.5}px, 60px) rotate(${tilt.y * 0.3}deg)`,
          animation: 'floatSlow 4s ease-in-out infinite alternate',
        }}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[13px]">🛕</span>
        <span>100% Temple Verified</span>
      </div>

      <div
        className="pointer-events-none absolute -bottom-3 -left-3 z-30 hidden sm:flex items-center gap-2 rounded-full border border-gold-300/30 bg-temple-900/85 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-transform duration-300"
        style={{
          transform: `translate3d(${-tilt.y * 1.2}px, ${tilt.x * 1.2}px, 50px)`,
          animation: 'floatSlow 4.8s ease-in-out infinite alternate-reverse',
        }}
      >
        <span className="text-gold-400 font-bold">⚡ 0% Fee</span>
        <span className="text-temple-200">Direct Hotel Pricing</span>
      </div>

      {/* Main 3D Card Container */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-b from-temple-800/90 via-temple-900/95 to-temple-950 p-4 text-white shadow-2xl backdrop-blur-xl transition-transform duration-200 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${tilt.active ? 1.02 : 1}, ${tilt.active ? 1.02 : 1}, 1)`,
          boxShadow: tilt.active
            ? '0 25px 60px -12px rgba(223, 169, 44, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.7)'
            : '0 20px 45px -15px rgba(0, 0, 0, 0.6), 0 0 25px rgba(223, 169, 44, 0.15)',
        }}
      >
        {/* Specular Light Reflection / Glare */}
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 0.35 : 0.08,
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 248, 220, 0.8) 0%, rgba(223, 169, 44, 0.2) 40%, transparent 70%)`,
          }}
        />

        {/* Decorative Golden Corner Accents */}
        <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-gold-400/60 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-gold-400/60 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-gold-400/60 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-gold-400/60 rounded-br-sm pointer-events-none" />

        {/* Image Showcase with 3D Depth Layer */}
        <div
          className="relative h-48 w-full overflow-hidden rounded-2xl transition-transform duration-300"
          style={{ transform: 'translateZ(25px)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hotel.image}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-temple-950 via-temple-900/30 to-transparent" />

          {/* Top Pill: Distance & Nada */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-temple-900/90 px-3 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md ring-1 ring-gold-400/30">
            <span>🛕</span>
            <span>{hotel.distance}</span>
            <span className="text-temple-400">•</span>
            <span className="text-white">{hotel.walkTime}</span>
          </div>

          {/* Rating Pill */}
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
            <span>★</span>
            <span>{hotel.rating}</span>
            <span className="text-[10px] text-zinc-300 font-normal">({hotel.reviews})</span>
          </div>

          {/* Bottom Banner inside Image: Live Darshan Timing */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-gold-900/80 to-temple-900/80 px-3 py-1.5 text-[11px] text-gold-200 backdrop-blur-md ring-1 ring-gold-400/20">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-white">Nirmalyam Darshan</span>
            </div>
            <span className="font-semibold text-gold-300">03:00 AM • Fast Walk</span>
          </div>
        </div>

        {/* Hotel Details in Elevated 3D Plane */}
        <div
          className="mt-3.5 space-y-2 px-1 transition-transform duration-300"
          style={{ transform: 'translateZ(35px)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 ring-1 ring-gold-400/30">
                {hotel.badge}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-white tracking-wide">
                {hotel.name}
              </h3>
              <p className="text-xs text-temple-200">
                📍 {hotel.nada}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-temple-300">From</p>
              <div className="font-display text-xl font-bold text-gold-300">
                ₹{hotel.price.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-temple-300">/ night</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-temple-100">
            <span className="rounded-md bg-white/10 px-2 py-0.5">{hotel.tag}</span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Free Cancellation</span>
          </div>

          {/* Hotel Carousel Controls & Book CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1">
              {PREVIEW_HOTELS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-gold-400'
                      : 'w-2 bg-white/25 hover:bg-white/50'
                  }`}
                  aria-label={`View stay ${idx + 1}`}
                />
              ))}
            </div>

            <Link
              href={`/hotels`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2 text-xs font-bold text-temple-950 shadow-md transition-all hover:brightness-110 hover:shadow-gold-500/25"
            >
              <span>Explore Stays</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
