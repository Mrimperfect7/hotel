'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api, getToken } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '📈' },
  { href: '/admin/hotels?status=PENDING', label: 'Verification Queue', icon: '⏳' },
  { href: '/admin/hotels', label: 'Hotels', icon: '🏨' },
  { href: '/admin/bookings', label: 'Bookings', icon: '🧾' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/audit', label: 'Audit Log', icon: '🔐' },
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
        <div className="card sticky top-20 bg-temple-700 p-3 text-white">
          <p className="rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gold-300">
            🛕 Admin Console
          </p>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${pathname + location.search === n.href ? 'bg-white/15 text-gold-200' : 'text-temple-100 hover:bg-white/10'}`}
            >
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="badge whitespace-nowrap bg-white text-temple-600 ring-1 ring-temple-200">
              {n.icon} {n.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}
