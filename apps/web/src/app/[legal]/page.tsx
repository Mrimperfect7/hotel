import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const PAGES: Record<string, { title: string; body: string[] }> = {
  about: {
    title: 'About Guruvayoor Stay',
    body: [
      'Guruvayoor Stay was built with a simple observation: millions of devotees visit Guruvayoor Sri Krishna Temple every year, yet finding honest, verified accommodation near the temple was a word-of-mouth exercise.',
      'We work directly with hotels, lodges, homestays and guest houses around the temple — verifying every property before it can accept a single booking. When you book here, your request goes straight to the hotel, and the hotel confirms it to you. No opaque listings, no bait-and-switch.',
      'Our team is based in Kerala, and we are devotees ourselves. 🛕',
    ],
  },
  contact: {
    title: 'Contact Us',
    body: [
      'For booking support: support@guruvayoorstay.test',
      'For hotel owners: partners@guruvayoorstay.test',
      'Phone/WhatsApp: +91 90000 00000 (9 AM – 9 PM IST)',
      'Registered office: Guruvayoor, Thrissur District, Kerala 680101, India.',
    ],
  },
  'cancellation-policy': {
    title: 'Cancellation Policy',
    body: [
      'Each hotel sets its own cancellation policy, shown clearly on the hotel page and at checkout:',
      'FREE CANCEL 24H — free cancellation until 24 hours before check-in.',
      'FREE CANCEL 48H — free cancellation until 48 hours before check-in.',
      'MODERATE — free cancellation until 48 hours before check-in; later cancellations may retain one night\'s charge.',
      'STRICT — cancellations within 72 hours of check-in may retain the full amount.',
      'NON-REFUNDABLE — the booking amount is retained on cancellation.',
      'When a hotel cancels your confirmed booking, you are always refunded in full.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      'By using Guruvayoor Stay you agree to provide accurate contact details so hotels can reach you about your booking.',
      'Bookings are requests until the hotel confirms them. A confirmed booking is a contract between you and the hotel; Guruvayoor Stay is the platform that facilitates it.',
      'Rates include taxes shown at checkout. The platform commission is paid by the hotel, not added to your price.',
      'We verify every property before listing and suspend properties that receive verified complaints about safety or fraud.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We collect only the information needed to operate bookings: your name, contact details and stay preferences.',
      'Your contact details are shared with the hotel you book — and only that hotel. We never sell personal data.',
      'Payments are processed by Razorpay (PCI-DSS compliant). We never see or store your card details.',
      'You can request deletion of your account and data at privacy@guruvayoorstay.test.',
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((page) => ({ legal: page }));
}

export async function generateMetadata({ params }: { params: Promise<{ legal: string }> }): Promise<Metadata> {
  const { legal } = await params;
  const page = PAGES[legal];
  return { title: page?.title ?? 'Not found' };
}

export default async function LegalPage({ params }: { params: Promise<{ legal: string }> }) {
  const { legal } = await params;
  const page = PAGES[legal];
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl font-bold text-temple-700">{page.title}</h1>
      <div className="mt-6 space-y-4 text-temple-600">
        {page.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}
