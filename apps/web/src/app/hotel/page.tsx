'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HotelRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Hotel Owner Portal lives at /owner; redirect cleanly
    router.replace('/owner');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-temple-600 gap-3">
      <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="font-semibold text-sm">Redirecting to Hotel Owner Portal…</p>
    </div>
  );
}
