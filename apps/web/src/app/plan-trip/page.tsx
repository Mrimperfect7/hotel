'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function PlanTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    arrivalDate: '',
    departureDate: '',
    adults: 1,
    children: 0,
    seniorCitizens: 0,
    arrivalLocation: 'Railway Station',
    departureLocation: 'Railway Station',
    budget: 'STANDARD',
    purpose: 'TEMPLE'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.arrivalDate || !formData.departureDate) {
        alert('Please select both Arrival and Departure dates.');
        return;
      }
      if (new Date(formData.departureDate) < new Date(formData.arrivalDate)) {
        alert('Departure date cannot be before arrival date.');
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const { getToken } = require('@/lib/api');
    if (!getToken()) {
      alert('Please log in to save and generate your trip.');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/plan-trip', {
        ...formData,
        arrivalDate: new Date(formData.arrivalDate).toISOString(),
        departureDate: new Date(formData.departureDate).toISOString(),
      }, true);
      router.push('/my-trip');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error generating trip');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-temple-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-temple-800">Plan My Guruvayoor Trip</h1>
            <p className="mt-2 text-temple-600">Personalized itineraries based on your needs.</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-8 bg-white shadow-xl">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold text-temple-700 border-b pb-2 mb-4">Dates & Location</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Arrival Date</label>
                    <input type="date" required className="input" value={formData.arrivalDate} onChange={e => updateField('arrivalDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Departure Date</label>
                    <input type="date" required className="input" value={formData.departureDate} onChange={e => updateField('departureDate', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Arrival At</label>
                  <select className="input" value={formData.arrivalLocation} onChange={e => updateField('arrivalLocation', e.target.value)}>
                    <option value="Railway Station">Guruvayoor Railway Station</option>
                    <option value="Bus Stand">KSRTC Bus Stand</option>
                    <option value="Airport">Cochin International Airport</option>
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold text-temple-700 border-b pb-2 mb-4">Who is Traveling?</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Adults</label>
                    <input type="number" min="1" className="input" value={formData.adults} onChange={e => updateField('adults', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Children</label>
                    <input type="number" min="0" className="input" value={formData.children} onChange={e => updateField('children', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Senior Citizens</label>
                    <input type="number" min="0" className="input" value={formData.seniorCitizens} onChange={e => updateField('seniorCitizens', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold text-temple-700 border-b pb-2 mb-4">Preferences</h2>
                <div>
                  <label className="block text-sm font-semibold mb-1">Purpose of Trip</label>
                  <select className="input" value={formData.purpose} onChange={e => updateField('purpose', e.target.value)}>
                    <option value="TEMPLE">Temple Visit / Darshan</option>
                    <option value="PILGRIMAGE">Pilgrimage</option>
                    <option value="FAMILY">Family Trip</option>
                    <option value="SENIOR">Senior Citizen Trip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Budget</label>
                  <select className="input" value={formData.budget} onChange={e => updateField('budget', e.target.value)}>
                    <option value="BUDGET">Budget (₹)</option>
                    <option value="STANDARD">Standard (₹₹)</option>
                    <option value="PREMIUM">Premium (₹₹₹)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="btn-outline">Back</button>
              ) : <div></div>}
              <button type="submit" className="btn-gold" disabled={loading}>
                {loading ? 'Planning...' : step === 3 ? 'Generate My Trip' : 'Next Step'}
              </button>
            </div>
          </form>
        </div>
      </main>
          </div>
  );
}
