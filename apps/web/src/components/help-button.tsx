'use client';

import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function HelpButton() {
  const pathname = usePathname();
  
  // Optionally, don't show the floating button if they are already on the support page
  if (pathname === '/support') return null;

  return (
    <Link
      href="/support"
      aria-label="Emergency SOS & Pilgrim Help"
      className="fixed bottom-24 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-full shadow-2xl hover:from-red-700 hover:to-red-800 hover:scale-105 transition-all group border-2 border-white/30"
    >
      <LifeBuoy className="w-5 h-5 text-white animate-spin-slow" />
      <span className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 animate-ping" />
        Emergency SOS
      </span>
      
      {/* Pulse animation for visibility */}
      <span className="absolute -inset-1 rounded-full border-2 border-red-500 animate-ping opacity-25 group-hover:opacity-0 pointer-events-none"></span>
    </Link>
  );
}
