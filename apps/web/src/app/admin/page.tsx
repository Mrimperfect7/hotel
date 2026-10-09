'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { Map, ShieldCheck, Car, Users, Headset, Utensils, Route, Building } from 'lucide-react';

type ControlCenterStats = {
  // Ecosystem Overview
  operations: {
    activeTrips: number;
    activeRides: number;
    onlineDrivers: number;
    foodOrders: number;
    activeGuides: number;
  };
  hotels: { total: number; pending: number; approved: number; suspended: number };
  bookings: { total: number; todayCheckins: number };
  support: { openTickets: number; critical: number };
  revenuePaise: number;
};

export default function NammaControlCenterPage() {
  const [s, setS] = useState<ControlCenterStats | null>(null);

  useEffect(() => {
    // We fetch existing stats and mock the new Namma Ecosystem stats for the UI
    api.get<any>('/api/admin/stats', true).then((data) => {
      setS({
        operations: {
          activeTrips: 142,
          activeRides: 18,
          onlineDrivers: 45,
          foodOrders: 32,
          activeGuides: 12
        },
        hotels: data.hotels,
        bookings: { total: data.bookings.total, todayCheckins: data.bookings.upcomingCheckins },
        support: { openTickets: 5, critical: 1 },
        revenuePaise: data.revenuePaise
      });
    }).catch(() => {});
  }, []);

  if (!s) {
    return (
      <div className="grid grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => <div key={i} className="card h-24 bg-temple-50" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-temple-900">Namma Control Center</h1>
          <p className="text-sm text-temple-500 font-medium tracking-wide">ECOSYSTEM OPERATIONS DASHBOARD</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-temple-100 shadow-sm">
          <input type="text" placeholder="Search Trip ID (NMG-...)" className="input py-1 px-3 text-sm min-w-[200px]" />
          <button className="btn-gold py-1.5 px-4 text-sm whitespace-nowrap">Track Trip</button>
        </div>
      </div>

      {/* Critical Alerts Row */}
      {(s.hotels.pending > 0 || s.support.openTickets > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {s.support.openTickets > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-red-800 flex items-center gap-2"><Headset className="w-5 h-5" /> Support Queue</h3>
                <p className="text-sm text-red-600">{s.support.openTickets} Open Tickets ({s.support.critical} Critical SOS)</p>
              </div>
              <button className="text-red-700 bg-red-100 px-3 py-1 rounded text-sm font-bold hover:bg-red-200">Resolve</button>
            </div>
          )}
          
          {s.hotels.pending > 0 && (
            <div className="bg-gold-50 border-l-4 border-gold-500 p-4 rounded-r-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gold-800 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Verification Queue</h3>
                <p className="text-sm text-gold-600">{s.hotels.pending} Hotels pending admin approval</p>
              </div>
              <a href="/admin/hotels?status=PENDING" className="text-gold-700 bg-gold-200 px-3 py-1 rounded text-sm font-bold hover:bg-gold-300">Review</a>
            </div>
          )}
        </div>
      )}

      {/* Live Operations Stats */}
      <h2 className="font-bold text-temple-700 border-b border-temple-100 pb-2 mt-8">Live Operations (Today)</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <Route className="w-6 h-6 text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-temple-900">{s.operations.activeTrips}</div>
          <div className="text-[11px] font-bold text-temple-500 uppercase tracking-wide">Active Trips</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
          <Car className="w-6 h-6 text-yellow-600 mb-2" />
          <div className="text-2xl font-bold text-temple-900">{s.operations.activeRides} <span className="text-sm text-temple-400 font-normal">/ {s.operations.onlineDrivers} online</span></div>
          <div className="text-[11px] font-bold text-temple-500 uppercase tracking-wide">Live Rides</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
          <Building className="w-6 h-6 text-green-600 mb-2" />
          <div className="text-2xl font-bold text-temple-900">{s.bookings.todayCheckins}</div>
          <div className="text-[11px] font-bold text-temple-500 uppercase tracking-wide">Check-ins Today</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-rose-50 to-white border-rose-100">
          <Utensils className="w-6 h-6 text-rose-600 mb-2" />
          <div className="text-2xl font-bold text-temple-900">{s.operations.foodOrders}</div>
          <div className="text-[11px] font-bold text-temple-500 uppercase tracking-wide">Food Orders</div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <Users className="w-6 h-6 text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-temple-900">{s.operations.activeGuides}</div>
          <div className="text-[11px] font-bold text-temple-500 uppercase tracking-wide">Active Guides</div>
        </div>
      </div>

      {/* Ecosystem Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="font-bold text-temple-700 mb-4 flex items-center gap-2">Hotel Partners</h2>
          <div className="space-y-4">
            {([
              ['Approved & Active', s.hotels.approved, 'bg-kerala-500'],
              ['Pending Review', s.hotels.pending, 'bg-gold-400'],
              ['Suspended', s.hotels.suspended, 'bg-red-300'],
            ] as Array<[string, number, string]>).map(([label, n, color]) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-32 font-medium text-temple-600">{label}</span>
                <div className="h-2.5 flex-1 rounded-full bg-temple-50 overflow-hidden border border-temple-100">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${s.hotels.total ? (n / s.hotels.total) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-temple-700">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 bg-temple-800 text-white border-none shadow-xl">
          <h2 className="font-bold text-gold-400 mb-2">Ecosystem Health</h2>
          <p className="text-temple-300 text-sm mb-6">Real-time revenue tracking across all verticals.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-temple-400 uppercase tracking-widest">Gross GMV</div>
              <div className="text-3xl font-bold text-white mt-1">{formatINR(s.revenuePaise)}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-temple-400 uppercase tracking-widest">Est. Commission</div>
              <div className="text-3xl font-bold text-gold-400 mt-1">{formatINR(s.revenuePaise * 0.1)}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
