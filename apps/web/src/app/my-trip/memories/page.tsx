'use client';
import { Share2, Download, Heart } from 'lucide-react';
import Link from 'next/link';

export default function JourneyMemoriesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-temple-900 text-white selection:bg-gold-500 selection:text-temple-900">
      <main className="flex-1 py-12 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          
          <h1 className="font-display text-3xl font-bold text-gold-400 mb-2">
            YOUR JOURNEY IS COMPLETE <Heart className="inline w-6 h-6 text-red-500 fill-current animate-pulse" />
          </h1>
          <p className="text-temple-300 mb-8 font-medium">May the blessings of Lord Krishna be with you.</p>

          {/* The Shareable Memory Card */}
          <div className="bg-white rounded-3xl p-8 text-left shadow-2xl relative overflow-hidden transform transition hover:scale-105 duration-500 border-4 border-gold-400">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-temple-50 rounded-full translate-y-20 -translate-x-16 opacity-50"></div>

            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-1 bg-gold-100 text-gold-800 text-xs font-bold rounded-full tracking-widest uppercase mb-4">
                  My Guruvayoor Journey
                </div>
                <h2 className="font-display text-4xl font-bold text-temple-900">October 2026</h2>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-semibold">Duration</span>
                  <span className="font-bold text-temple-800 text-lg">2 Days</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-semibold">Places Visited</span>
                  <span className="font-bold text-temple-800 text-lg">7 Places</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-semibold">Stay</span>
                  <span className="font-bold text-temple-800 text-lg">Srivari Residency</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-semibold">Rides Taken</span>
                  <span className="font-bold text-temple-800 text-lg">3 Rides 🚕</span>
                </div>
              </div>

              <div className="text-center border-t-2 border-dashed border-gray-200 pt-6">
                <div className="text-sm font-bold text-temple-400 uppercase tracking-widest mb-1">Created with</div>
                <div className="font-display font-bold text-xl text-gold-600">NAMMA GURUVAYOOR</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="bg-white text-temple-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-50 transition">
              <Share2 className="w-5 h-5" /> Share
            </button>
            <button className="bg-gold-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-500 transition">
              <Download className="w-5 h-5" /> Download
            </button>
          </div>

          <div className="mt-8">
            <Link href="/" className="text-temple-400 font-medium hover:text-white transition">
              Return Home
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
