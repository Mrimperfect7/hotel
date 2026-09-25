'use client';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { api } from '@/lib/api';
import { Crown, Sparkles, Gift } from 'lucide-react';

type LoyaltyTier = {
  name: string;
  minBookings: number;
  discountPercent: number;
};

type LoyaltyAccount = {
  tier: LoyaltyTier;
  completedBookings: number;
  totalSpentPaise: number;
};

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: LoyaltyAccount | null }>('/api/loyalty/me', true)
      .then(res => setAccount(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-temple-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-temple-800 flex items-center justify-center gap-3">
              <Crown className="w-10 h-10 text-gold-500" /> Namma Loyalty
            </h1>
            <p className="mt-2 text-temple-600">Returning customer benefits and personalized offers.</p>
          </div>

          {loading ? (
            <p className="text-center text-temple-500">Loading your benefits...</p>
          ) : !account ? (
            <div className="card p-8 text-center bg-white border border-temple-100 shadow-xl max-w-2xl mx-auto">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-temple-800">Start Your Journey</h2>
              <p className="text-temple-600 mt-2 mb-6">Complete bookings with Namma Guruvayoor to unlock exclusive discounts on hotels, rides, and guides.</p>
              <div className="grid grid-cols-3 gap-4 border-t pt-6">
                <div>
                  <h4 className="font-bold text-gold-600">3 Bookings</h4>
                  <p className="text-xs text-temple-500 mt-1">RETURNING CUSTOMER<br/>5% Off</p>
                </div>
                <div>
                  <h4 className="font-bold text-gold-600">5 Bookings</h4>
                  <p className="text-xs text-temple-500 mt-1">LOYAL TRAVELLER<br/>10% Off</p>
                </div>
                <div>
                  <h4 className="font-bold text-gold-600">10 Bookings</h4>
                  <p className="text-xs text-temple-500 mt-1">PREMIUM TRAVELLER<br/>15% Off</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card p-6 bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <Crown className="w-12 h-12 text-white opacity-80" />
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold tracking-widest">TIER UNLOCKED</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-1">{account.tier.name.replace('_', ' ')}</h2>
                  <p className="text-gold-100">{account.completedBookings} Completed Bookings</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h3 className="text-2xl font-bold">{account.tier.discountPercent}% Off</h3>
                  <p className="text-gold-100 text-sm">On all eligible Namma Services</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card p-6 bg-white border border-temple-100">
                  <h3 className="font-bold text-lg text-temple-800 flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-kerala-600" /> Active Offers
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 bg-temple-50 rounded-lg border border-temple-100">
                      <Sparkles className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-temple-700 text-sm">Guruvayoor Ekadashi Special</p>
                        <p className="text-xs text-temple-500 mt-0.5">Extra 5% off on Temple-Area Hotels.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-temple-50 rounded-lg border border-temple-100">
                      <Sparkles className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-temple-700 text-sm">Free Airport Pickup Upgrade</p>
                        <p className="text-xs text-temple-500 mt-0.5">Book a Sedan, get an SUV for Premium Travellers.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
