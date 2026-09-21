'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getToken, clearTokens } from '@/lib/api';

type Me = { user: { name: string; role: string } };

export function SiteHeader() {
  const [user, setUser] = useState<Me['user'] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api
      .get<Me>('/api/auth/me', true)
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-temple-100 bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Namma Guruvayoor" className="h-11 w-11 rounded-lg object-contain" />
          <span className="font-display text-lg font-bold leading-tight text-temple-700">
            Guruvayoor <span className="text-gold-600">Go</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-temple-700 md:flex">
          <Link href="/hotels" className="hover:text-gold-600">Stay</Link>
          <Link href="/guides" className="hover:text-gold-600">Guide</Link>
          <Link href="/rides" className="hover:text-gold-600">Ride</Link>
          <Link href="/food" className="hover:text-gold-600">Food</Link>
          <Link href="/list-your-service" className="hover:text-gold-600">Partner With Us</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {(user.role === 'HOTEL_OWNER') && (
                <Link href="/owner" className="text-sm font-semibold text-gold-700">Owner Dashboard</Link>
              )}
              {(user.role === 'GUIDE') && (
                <Link href="/guide-dashboard" className="text-sm font-semibold text-gold-700">Guide Dashboard</Link>
              )}
              {(user.role === 'DRIVER') && (
                <Link href="/driver-dashboard" className="text-sm font-semibold text-gold-700">Driver Dashboard</Link>
              )}
              {(user.role === 'RESTAURANT_OWNER') && (
                <Link href="/restaurant-dashboard" className="text-sm font-semibold text-gold-700">Restaurant Dashboard</Link>
              )}
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="text-sm font-semibold text-gold-700">Admin Panel</Link>
              )}
              <Link href="/my-trip" className="btn-outline">My Trip</Link>
              <button
                onClick={() => { clearTokens(); setUser(null); window.location.href = '/'; }}
                className="text-sm text-temple-400 hover:text-temple-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-temple-700 hover:text-gold-600">Sign in</Link>
              <Link href="/register" className="btn-primary">Create account</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="border-t border-temple-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/hotels">Stay</Link>
            <Link href="/guides">Guide</Link>
            <Link href="/rides">Ride</Link>
            <Link href="/food">Food</Link>
            <Link href="/list-your-service">Partner With Us</Link>
            <Link href="/my-trip">My Trip</Link>
            <Link href="/login" className="btn-primary">Sign in</Link>
          </div>
        </div>
      )}
    </header>
  );
}
