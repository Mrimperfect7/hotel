import type { MetadataRoute } from 'next';

const API = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/hotels', '/list-your-hotel', '/about', '/contact', '/terms', '/privacy',
    '/cancellation-policy', '/collections/pilgrims', '/collections/families',
    '/collections/budget', '/collections/ac', '/collections/parking',
  ].map((path) => ({ url: `${SITE}${path}`, changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.7 }));

  let hotelRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/api/hotels?limit=50`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = (await res.json()) as { hotels: Array<{ slug: string; id: string }> };
      hotelRoutes = data.hotels.map((h) => ({
        url: `${SITE}/hotels/${h.slug}`,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    }
  } catch {
    // API unreachable — ship static routes only.
  }

  return [...staticRoutes, ...hotelRoutes];
}
