'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { LifeBuoy, AlertCircle, MapPin, HeartHandshake } from 'lucide-react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    category: 'HOTEL_ISSUE',
    subject: '',
    description: '',
    tripCode: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/support/ticket', formData, true);
      setSubmitted(true);
    } catch (err) {
      alert('Error creating ticket');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
            <main className="flex-1 bg-temple-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-temple-800 flex items-center justify-center gap-3">
              <LifeBuoy className="w-10 h-10 text-red-500" /> Need Help?
            </h1>
            <p className="mt-2 text-temple-600">We are here to assist with your Guruvayoor journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <div className="card p-4 bg-white border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-temple-800">Emergency Contacts</h3>
                  <p className="text-xs text-temple-500 mt-1">Police: 100<br/>Ambulance: 108<br/>Temple Info: 0487-2556335</p>
                </div>
              </div>
              
              <div className="card p-4 bg-white border border-temple-100 flex items-start gap-3">
                <HeartHandshake className="w-6 h-6 text-gold-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-temple-800">Concierge Services</h3>
                  <p className="text-xs text-temple-500 mt-1">Need help with elderly parents? Want a full trip planned? Select "Concierge" below.</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 card p-6 bg-white shadow-lg border border-temple-100">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-temple-800">Request Received</h2>
                  <p className="text-temple-600 mt-2">Our local support team will contact you shortly.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-outline mt-6">Submit Another Request</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-xl font-bold text-temple-800 border-b pb-2">Submit a Ticket</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Issue Category</label>
                      <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="HOTEL_ISSUE">Hotel Issue</option>
                        <option value="RIDE_ISSUE">Transport / Ride Issue</option>
                        <option value="GUIDE_ISSUE">Local Guide Issue</option>
                        <option value="FOOD_ISSUE">Food Order Issue</option>
                        <option value="CONCIERGE">Concierge / Planning Help</option>
                        <option value="OTHER">Other / General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Trip ID (Optional)</label>
                      <input type="text" className="input" placeholder="NMG-2026-..." value={formData.tripCode} onChange={e => setFormData({...formData, tripCode: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Subject</label>
                    <input type="text" required className="input" placeholder="Brief summary of the issue" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Description</label>
                    <textarea required className="input h-32" placeholder="Please provide details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="btn-gold">Submit Request</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
          </div>
  );
}
