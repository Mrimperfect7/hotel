'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api, getToken } from '@/lib/api';
import {
  LayoutDashboard,
  Hotel,
  MapPin,
  Sparkles,
  User,
  LifeBuoy
} from 'lucide-react';

const NAV = [
  { href: '/customer', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/customer/bookings', label: 'My Bookings', icon: <Hotel className="w-4 h-4" /> },
  { href: '/customer/trip', label: 'My Trip', icon: <MapPin className="w-4 h-4" /> },
  { href: '/customer/loyalty', label: 'Loyalty & Rewards', icon: <Sparkles className="w-4 h-4" /> },
  { href: '/customer/profile', label: 'Profile Settings', icon: <User className="w-4 h-4" /> },
  { href: '/customer/support', label: 'Support & Help', icon: <LifeBuoy className="w-4 h-4" /> },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?next=/customer');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return <div className="p-10 text-center text-temple-400">Loading customer portal…</div>;
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="card sticky top-20 p-3">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-temple-400">
            Devotee Portal
          </p>
          <div className="space-y-1">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-temple-600 text-white shadow-sm'
                      : 'text-temple-600 hover:bg-temple-50'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-gold-600'}>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1">
        {/* Mobile Horizontal Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`badge whitespace-nowrap text-xs py-2 px-3 flex items-center gap-1.5 ${
                  active
                    ? 'bg-temple-600 text-white shadow-sm'
                    : 'bg-white text-temple-600 ring-1 ring-temple-200'
                }`}
              >
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </div>
        {children}
      </main>
    </div>
  );
}
