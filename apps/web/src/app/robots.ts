import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/owner', '/my-bookings', '/booking', '/api'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
