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
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-temple-600 text-lg text-gold-300">🛕</span>
          <span className="font-display text-lg font-bold text-temple-700">
            Guruvayoor <span className="text-gold-600">Stay</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-temple-700 md:flex">
          <Link href="/hotels" className="hover:text-gold-600">Hotels</Link>
          <Link href="/hotels?band=u500" className="hover:text-gold-600">Near Temple</Link>
          <Link href="/collections/families" className="hover:text-gold-600">Families</Link>
          <Link href="/collections/budget" className="hover:text-gold-600">Budget</Link>
          <Link href="/list-your-hotel" className="hover:text-gold-600">List Your Hotel</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {(user.role === 'HOTEL_OWNER') && (
                <Link href="/owner" className="text-sm font-semibold text-gold-700">Owner Dashboard</Link>
              )}
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <Link href="/admin" className="text-sm font-semibold text-gold-700">Admin Panel</Link>
              )}
              <Link href="/my-bookings" className="btn-outline">My Bookings</Link>
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
            <Link href="/hotels">Hotels</Link>
            <Link href="/list-your-hotel">List Your Hotel</Link>
            <Link href="/my-bookings">My Bookings</Link>
            <Link href="/login" className="btn-primary">Sign in</Link>
          </div>
        </div>
      )}
    </header>
  );
}
