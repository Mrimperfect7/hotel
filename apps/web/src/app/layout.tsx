import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Guruvayoor Stay — Hotels near Guruvayoor Sri Krishna Temple',
    template: '%s · Guruvayoor Stay',
  },
  description:
    'Book verified hotels, homestays and lodges within walking distance of Guruvayoor Sri Krishna Temple, Kerala. Direct hotel confirmations, pilgrim-friendly stays.',
  openGraph: {
    siteName: 'Guruvayoor Stay',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
