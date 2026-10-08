'use client';
import Link from 'next/link';
import { Package, ShieldCheck, Star } from 'lucide-react';

const MOCK_PACKAGES = [
  {
    id: 'pkg-family',
    slug: 'family-guruvayoor-journey',
    name: 'Family Guruvayoor Journey',
    description: 'Perfect for families. Includes a comfortable stay, railway transfer, and an arranged local sightseeing guide.',
    pricePaise: 450000, // ₹4500
    discountPaise: 50000,
    minTravelers: 2,
    inclusions: ['🏨 Hotel Stay (1 Night)', '🚕 Railway Station Transfer', '🧑‍🏫 Local Sightseeing Guide', '🍛 Temple Prasadam Assistance']
  },
  {
    id: 'pkg-senior',
    slug: 'senior-citizen-journey',
    name: 'Senior Citizen Journey',
    description: 'A slow-paced, low-walking itinerary prioritizing comfort and accessibility for elderly pilgrims.',
    pricePaise: 600000,
    discountPaise: 0,
    minTravelers: 1,
    inclusions: ['🏨 Lift-equipped Hotel (Under 200m from Temple)', '🚕 Door-to-door Transport', '🧑‍💼 Assistance Staff', '🛕 Low-walking itinerary']
  },
  {
    id: 'pkg-weekend',
    slug: 'weekend-guruvayoor',
    name: 'Weekend Guruvayoor Getaway',
    description: 'A complete package for a weekend escape including temple visit and local cultural exploration.',
    pricePaise: 350000,
    discountPaise: 25000,
    minTravelers: 1,
    inclusions: ['🏨 Standard Stay', '📍 Cultural Places Explore', '🍛 Local Kerala Meals']
  }
];

export default function PackagesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-temple-50/50">
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-temple-800 flex items-center justify-center gap-3">
              <Package className="w-10 h-10 text-gold-600" /> Book My Journey
            </h1>
            <p className="mt-4 text-temple-600 max-w-2xl mx-auto">
              Don't just book a room. Book a complete, stress-free Guruvayoor experience. Everything is connected under <strong>One Trip ID</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_PACKAGES.map(pkg => (
              <div key={pkg.id} className="card bg-white rounded-2xl overflow-hidden border border-temple-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-48 bg-gradient-to-br from-gold-100 to-temple-200 relative p-6 flex flex-col justify-end">
                  {pkg.discountPaise > 0 && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-current" /> Special Offer
                    </div>
                  )}
                  <h2 className="font-display text-2xl font-bold text-temple-900 leading-tight">{pkg.name}</h2>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-sm text-temple-600 mb-6 flex-1">{pkg.description}</p>
                  
                  <div className="bg-temple-50 rounded-xl p-4 mb-6">
                    <h3 className="text-xs font-bold uppercase text-temple-500 mb-3 tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-green-600" /> What's Included
                    </h3>
                    <ul className="space-y-2 text-sm font-semibold text-temple-800">
                      {pkg.inclusions.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <div className="text-xs font-bold text-temple-500 uppercase">Starting From</div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-temple-900">₹{(pkg.pricePaise - pkg.discountPaise) / 100}</span>
                        {pkg.discountPaise > 0 && (
                          <span className="text-sm text-temple-400 line-through">₹{pkg.pricePaise / 100}</span>
                        )}
                      </div>
                      <div className="text-xs text-temple-500">per person</div>
                    </div>
                  </div>

                  <button className="btn-gold w-full py-3 rounded-xl shadow-md text-lg" onClick={() => alert('Package Booking Flow Coming Soon!')}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
