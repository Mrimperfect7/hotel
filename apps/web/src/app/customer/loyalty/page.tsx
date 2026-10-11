'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Sparkles, Award, Gift, CheckCircle, Percent } from 'lucide-react';

export default function CustomerLoyaltyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-gold-600" /> Pilgrim Loyalty & Rewards
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Exclusive discounts and privileges for returning devotees of Sri Krishna Temple.
          </p>
        </div>
      </div>

      {/* Current Tier Badge */}
      <div className="card p-6 bg-gradient-to-r from-gold-500 to-amber-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge bg-white text-gold-900 font-bold text-xs uppercase px-3 py-1">
              Active Tier
            </span>
            <h2 className="font-display text-2xl font-bold mt-2">Returning Pilgrim Member</h2>
            <p className="text-gold-100 text-xs mt-1">
              Automatic 5% savings applied on all verified hotel and taxi bookings.
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-extrabold">5% OFF</p>
            <p className="text-xs text-gold-100 uppercase tracking-wider">Per Booking</p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 border border-gold-200 bg-gold-50/30">
          <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center text-xl mb-3">
            🏨
          </div>
          <h3 className="font-bold text-temple-800 text-base">Direct Hotel Discounts</h3>
          <p className="text-xs text-temple-600 mt-1.5 leading-relaxed">
            No middleman fees. Direct room allocation priority within 500 meters of the Temple East Nada.
          </p>
        </div>

        <div className="card p-5 border border-temple-100">
          <div className="w-10 h-10 rounded-full bg-temple-100 text-temple-800 flex items-center justify-center text-xl mb-3">
            👴
          </div>
          <h3 className="font-bold text-temple-800 text-base">Senior Citizen Concierge</h3>
          <p className="text-xs text-temple-600 mt-1.5 leading-relaxed">
            Complimentary wheelchair coordination and special queue darshan assistance for parents & elders.
          </p>
        </div>

        <div className="card p-5 border border-temple-100">
          <div className="w-10 h-10 rounded-full bg-temple-100 text-temple-800 flex items-center justify-center text-xl mb-3">
            🚕
          </div>
          <h3 className="font-bold text-temple-800 text-base">Fixed Fare Taxi Promise</h3>
          <p className="text-xs text-temple-600 mt-1.5 leading-relaxed">
            Guruvayoor Railway Station and Thrissur pickup at zero surge pricing, guaranteed.
          </p>
        </div>
      </div>

      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-temple-800 text-base">Ready for your next darshan?</h3>
          <p className="text-xs text-temple-500 mt-0.5">Explore nearest pilgrim stays with walking distance access.</p>
        </div>
        <Link href="/hotels" className="btn-gold text-xs py-2 px-4 font-bold">
          Browse Verified Hotels →
        </Link>
      </div>
    </div>
  );
}
