'use client';

import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function HelpButton() {
  const pathname = usePathname();
  
  // Optionally, don't show the floating button if they are already on the support page
  if (pathname === '/support') return null;

  return (
    <Link href="/support" className="fixed bottom-6 right-6 z-50 flex items-center justify-center bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-105 transition-all group">
      <LifeBuoy className="w-6 h-6 mr-0 md:mr-2" />
      <span className="hidden md:inline font-bold">HELP</span>
      
      {/* Pulse animation for visibility */}
      <span className="absolute -inset-1 rounded-full border-2 border-red-500 animate-ping opacity-20 group-hover:opacity-0"></span>
    </Link>
  );
}
