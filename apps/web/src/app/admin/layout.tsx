'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api, getToken } from '@/lib/api';
import { TrendingUp, Clock, Building, UserCheck, Car, Utensils, Receipt, Users, Star, Settings, Lock, Smartphone, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
  { href: '/admin/hotels?status=PENDING', label: 'Verification Queue', icon: <Clock className="w-4 h-4" /> },
  { href: '/admin/hotels', label: 'Hotels', icon: <Building className="w-4 h-4" /> },
  { href: '/admin/guides', label: 'Guides', icon: <UserCheck className="w-4 h-4" /> },
  { href: '/admin/drivers', label: 'Drivers', icon: <Car className="w-4 h-4" /> },
  { href: '/admin/restaurants', label: 'Restaurants', icon: <Utensils className="w-4 h-4" /> },
  { href: '/admin/bookings', label: 'Bookings', icon: <Receipt className="w-4 h-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  { href: '/admin/audit', label: 'Audit Log', icon: <Lock className="w-4 h-4" /> },
  { href: '/admin/subscribers', label: 'Marketing', icon: <Smartphone className="w-4 h-4" /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login?next=/admin'); return; }
    api.get<{ user: { role: string } }>('/api/auth/me', true)
      .then((r) => {
        if (!['ADMIN', 'SUPER_ADMIN'].includes(r.user.role)) router.replace('/login?next=/admin');
        else setChecked(true);
      })
      .catch(() => router.replace('/login?next=/admin'));
  }, [router]);

  if (!checked) return <div className="p-10 text-center text-temple-400">Verifying admin session…</div>;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="card sticky top-20 p-3">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-temple-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Console
          </p>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${pathname + (typeof window !== 'undefined' ? window.location.search : '') === n.href ? 'bg-temple-600 text-white' : 'text-temple-600 hover:bg-temple-50'}`}
            >
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={`badge whitespace-nowrap ${pathname + (typeof window !== 'undefined' ? window.location.search : '') === n.href ? 'bg-temple-600 text-white' : 'bg-white text-temple-600 ring-1 ring-temple-200'}`}>
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
