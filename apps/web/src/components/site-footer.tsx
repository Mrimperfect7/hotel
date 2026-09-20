import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-temple-100 bg-white">
      <div className="arch-divider" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Namma Guruvayoor" className="h-10 w-10 rounded-lg object-contain" />
            <span className="font-display font-bold text-temple-700">Namma Guruvayoor</span>
          </div>
          <p className="mt-3 text-sm text-temple-500">
            Verified stays near Guruvayoor Sri Krishna Temple — book directly with the hotel. <em>Book · Stay · Be Closer.</em>
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-temple-700">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-temple-500">
            <li><Link href="/hotels" className="hover:text-gold-600">All Hotels</Link></li>
            <li><Link href="/hotels?band=u500" className="hover:text-gold-600">Under 500 m from Temple</Link></li>
            <li><Link href="/collections/pilgrims" className="hover:text-gold-600">For Pilgrims</Link></li>
            <li><Link href="/collections/ac" className="hover:text-gold-600">AC Rooms</Link></li>
            <li><Link href="/collections/parking" className="hover:text-gold-600">With Parking</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-temple-700">Hotel Owners</h4>
          <ul className="mt-3 space-y-2 text-sm text-temple-500">
            <li><Link href="/list-your-hotel" className="hover:text-gold-600">List Your Hotel</Link></li>
            <li><Link href="/owner" className="hover:text-gold-600">Owner Dashboard</Link></li>
            <li><Link href="/docs/owner-onboarding" className="hover:text-gold-600">Onboarding Guide</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-temple-700">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-temple-500">
            <li><Link href="/about" className="hover:text-gold-600">About</Link></li>
            <li><Link href="/contact" className="hover:text-gold-600">Contact</Link></li>
            <li><Link href="/cancellation-policy" className="hover:text-gold-600">Cancellation Policy</Link></li>
            <li><Link href="/terms" className="hover:text-gold-600">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-gold-600">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-temple-100 py-4 text-center text-xs text-temple-400">
        🛕 Made for devotees · Guruvayoor, Thrissur District, Kerala · © {new Date().getFullYear()} Namma Guruvayoor
      </div>
    </footer>
  );
}
