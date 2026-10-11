'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function HotelCatchAllRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const slug = Array.isArray(params?.slug) ? params.slug.join('/') : params?.slug || '';
    router.replace(`/owner/${slug}`);
  }, [router, params]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-temple-600 gap-3">
      <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="font-semibold text-sm">Redirecting to Hotel Portal…</p>
    </div>
  );
}
