'use client';
import Link from 'next/link';
import { Car, Building2, Map, Utensils } from 'lucide-react';

export default function ListYourServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-temple-50 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-temple-800">Become a Partner</h1>
          <p className="mt-4 text-lg text-temple-600">
            Join Namma Guruvayoor and provide services to thousands of visiting pilgrims.
          </p>
          
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-left">
            <div className="card p-6 flex flex-col items-center text-center bg-white border border-temple-100 hover:border-gold-500 hover:shadow-lg transition">
              <Building2 className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-bold text-temple-700">List Your Hotel</h3>
              <p className="text-sm text-temple-500 mt-2 mb-4">Manage your rooms and reach more pilgrims.</p>
              <Link href="/list-your-hotel" className="btn-outline w-full mt-auto">Register Hotel</Link>
            </div>

            <div className="card p-6 flex flex-col items-center text-center bg-white border border-temple-100 hover:border-gold-500 hover:shadow-lg transition">
              <Car className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-bold text-temple-700">Drive for Namma</h3>
              <p className="text-sm text-temple-500 mt-2 mb-4">Register as a verified taxi or auto driver.</p>
              <Link href="/register?role=DRIVER" className="btn-outline w-full mt-auto">Register as Driver</Link>
            </div>

            <div className="card p-6 flex flex-col items-center text-center bg-white border border-temple-100 hover:border-gold-500 hover:shadow-lg transition">
              <Map className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-bold text-temple-700">Become a Guide</h3>
              <p className="text-sm text-temple-500 mt-2 mb-4">Share the history and culture of Guruvayoor.</p>
              <Link href="/register?role=GUIDE" className="btn-outline w-full mt-auto">Register as Guide</Link>
            </div>

            <div className="card p-6 flex flex-col items-center text-center bg-white border border-temple-100 hover:border-gold-500 hover:shadow-lg transition">
              <Utensils className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-bold text-temple-700">Add Restaurant</h3>
              <p className="text-sm text-temple-500 mt-2 mb-4">Let visitors pre-order food or find your restaurant.</p>
              <Link href="/register?role=RESTAURANT_OWNER" className="btn-outline w-full mt-auto">Register Restaurant</Link>
            </div>
          </div>
        </div>
      </main>
          </div>
  );
}
