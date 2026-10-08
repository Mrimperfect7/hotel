'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Car, Users, Clock, ShieldCheck, Phone } from 'lucide-react';

export default function RidesPage() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('Guruvayoor Temple');
  const [vehicleType, setVehicleType] = useState('AUTO');
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [rideState, setRideState] = useState<'IDLE' | 'SEARCHING' | 'ASSIGNED'>('IDLE');
  const [assignedDriver, setAssignedDriver] = useState<any>(null);

  const requestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRideState('SEARCHING');

    try {
      const res = await api.post('/api/rides/request', {
        pickupLocation: pickup,
        destination,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
        vehicleType,
        passengers,
        estimatedPaise: vehicleType === 'AUTO' ? 5000 : 15000
      }, true);

      // Simulate network delay for driver search
      setTimeout(() => {
        if (res.data?.driverId) {
          // If the backend synchronously assigned a driver (demo mode)
          setAssignedDriver({
            name: 'Rajesh K.',
            rating: 4.8,
            vehicle: vehicleType === 'AUTO' ? 'KL 46 H 1234 (Bajaj RE)' : 'KL 46 M 5678 (Swift Dzire)',
            color: vehicleType === 'AUTO' ? 'Yellow/Black' : 'White',
            eta: '4 min'
          });
          setRideState('ASSIGNED');
        } else {
          // Simulate a driver accepting after a few seconds
          setAssignedDriver({
            name: 'Suresh Menon',
            rating: 4.9,
            vehicle: vehicleType === 'AUTO' ? 'KL 46 Auto' : 'KL 46 XY 9012',
            color: 'Yellow',
            eta: '3 min'
          });
          setRideState('ASSIGNED');
        }
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Error requesting ride. Please login first.');
      router.push('/login?next=/rides');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-temple-50/50">
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-lg px-4">
          <div className="text-center mb-6">
            <h1 className="font-display text-3xl font-bold text-temple-800">Namma Ride</h1>
            <p className="text-temple-600 mt-1">Verified drivers. Safe journeys.</p>
          </div>

          {rideState === 'IDLE' && (
            <div className="bg-white rounded-2xl shadow-lg border border-temple-100 overflow-hidden">
              <div className="p-6">
                <form onSubmit={requestRide} className="space-y-5">
                  <div className="relative">
                    <div className="absolute top-9 left-4 bottom-9 w-0.5 bg-temple-200 z-0"></div>
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-temple-100 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-temple-600" />
                        </div>
                        <input type="text" required placeholder="Pickup Location (e.g. Railway Station)" 
                          className="input w-full bg-temple-50 border-transparent focus:bg-white" 
                          value={pickup} onChange={e => setPickup(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <Navigation className="w-4 h-4 text-red-600" />
                        </div>
                        <input type="text" required placeholder="Destination" 
                          className="input w-full bg-temple-50 border-transparent focus:bg-white" 
                          value={destination} onChange={e => setDestination(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-semibold mb-3 text-temple-800">Select Vehicle</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button type="button" onClick={() => setVehicleType('AUTO')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${vehicleType === 'AUTO' ? 'bg-gold-50 border-gold-400 ring-2 ring-gold-400/20' : 'border-temple-100 hover:border-gold-300'}`}>
                        <span className="text-2xl">🛺</span>
                        <span className="text-xs font-bold text-temple-800">Auto</span>
                      </button>
                      <button type="button" onClick={() => setVehicleType('CAR')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${vehicleType === 'CAR' ? 'bg-gold-50 border-gold-400 ring-2 ring-gold-400/20' : 'border-temple-100 hover:border-gold-300'}`}>
                        <span className="text-2xl">🚕</span>
                        <span className="text-xs font-bold text-temple-800">Car</span>
                      </button>
                      <button type="button" onClick={() => setVehicleType('VAN')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${vehicleType === 'VAN' ? 'bg-gold-50 border-gold-400 ring-2 ring-gold-400/20' : 'border-temple-100 hover:border-gold-300'}`}>
                        <span className="text-2xl">🚐</span>
                        <span className="text-xs font-bold text-temple-800">Van</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-sm font-semibold mb-2 text-temple-800">Passengers</label>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-10 h-10 rounded-full border border-temple-200 flex items-center justify-center hover:bg-temple-50">-</button>
                      <span className="font-bold text-lg w-4 text-center">{passengers}</span>
                      <button type="button" onClick={() => setPassengers(passengers + 1)} className="w-10 h-10 rounded-full border border-temple-200 flex items-center justify-center hover:bg-temple-50">+</button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-temple-100 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-temple-600 font-medium">Estimated Fare</span>
                      <span className="text-xl font-bold text-temple-900">₹{vehicleType === 'AUTO' ? '50 - 80' : vehicleType === 'CAR' ? '150 - 200' : '300+'}</span>
                    </div>
                    <button type="submit" disabled={!pickup || !destination} className="w-full btn-gold py-4 text-lg rounded-xl shadow-lg shadow-gold-500/30">
                      Find Namma Ride
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {rideState === 'SEARCHING' && (
            <div className="bg-white rounded-2xl shadow-lg border border-temple-100 p-10 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gold-200 border-t-gold-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🚕</div>
              </div>
              <h2 className="text-xl font-bold text-temple-800 mb-2">Finding your driver...</h2>
              <p className="text-temple-500">Connecting you to the nearest verified {vehicleType.toLowerCase()}.</p>
            </div>
          )}

          {rideState === 'ASSIGNED' && assignedDriver && (
            <div className="bg-white rounded-2xl shadow-lg border border-temple-100 overflow-hidden">
              <div className="bg-green-50 p-4 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-bold text-green-800">Driver Arriving in {assignedDriver.eta}</span>
                </div>
                <span className="bg-white px-2 py-1 rounded text-xs font-bold text-green-700 border border-green-200 shadow-sm">OTP: 4921</span>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-temple-100 rounded-full overflow-hidden border-2 border-white shadow flex items-center justify-center text-2xl">
                      🧑🏽
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-temple-900 flex items-center gap-1">
                        {assignedDriver.name}
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                      </h3>
                      <div className="flex items-center gap-1 text-sm font-medium text-temple-600">
                        <span className="text-yellow-500">★</span> {assignedDriver.rating} (120+ rides)
                      </div>
                    </div>
                  </div>
                  <button className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition">
                    <Phone className="w-5 h-5 fill-current" />
                  </button>
                </div>

                <div className="bg-temple-50 rounded-xl p-4 flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-temple-500 uppercase tracking-wider font-bold mb-1">Vehicle</div>
                    <div className="font-bold text-temple-800">{assignedDriver.vehicle}</div>
                    <div className="text-sm text-temple-600">{assignedDriver.color}</div>
                  </div>
                  <div className="text-4xl">
                    {vehicleType === 'AUTO' ? '🛺' : vehicleType === 'CAR' ? '🚕' : '🚐'}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setRideState('IDLE')} className="flex-1 btn-outline py-3 text-red-600 border-red-200 hover:bg-red-50">Cancel Ride</button>
                  <button onClick={() => router.push('/support')} className="flex-1 btn-outline py-3 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Safety
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
