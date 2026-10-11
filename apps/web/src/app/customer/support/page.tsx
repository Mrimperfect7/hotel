'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LifeBuoy, AlertCircle, Phone, HeartHandshake, CheckCircle } from 'lucide-react';

export default function CustomerSupportPage() {
  const [formData, setFormData] = useState({
    category: 'HOTEL_ISSUE',
    subject: '',
    description: '',
    tripCode: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/support/ticket', formData, true);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Error submitting support request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
          <LifeBuoy className="w-7 h-7 text-red-500" /> Devotee Support & 24/7 Pilgrim Helpline
        </h1>
        <p className="text-sm text-temple-500 mt-1">
          Instant assistance for room check-in issues, taxi pickups, temple darshan queries, or lost items.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Emergency Contacts card */}
        <div className="space-y-4">
          <div className="card p-5 border border-red-200 bg-red-50/50">
            <div className="flex items-center gap-2.5 text-red-700 font-bold text-sm mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Emergency Contacts
            </div>
            <div className="space-y-2 text-xs text-temple-700">
              <p>
                <strong>Police Control:</strong>{' '}
                <a href="tel:100" className="text-red-700 font-bold hover:underline">100</a>
              </p>
              <p>
                <strong>Ambulance (Emergency):</strong>{' '}
                <a href="tel:108" className="text-red-700 font-bold hover:underline">108</a>
              </p>
              <p>
                <strong>Guruvayoor Devaswom:</strong>{' '}
                <a href="tel:04872556335" className="text-temple-900 font-bold hover:underline">0487-2556335</a>
              </p>
              <p>
                <strong>Rajah Hospital (24/7):</strong>{' '}
                <a href="tel:04872556111" className="text-temple-900 font-bold hover:underline">0487-2556111</a>
              </p>
            </div>
          </div>

          <div className="card p-5 border border-gold-200 bg-gold-50/30">
            <div className="flex items-center gap-2.5 text-gold-900 font-bold text-sm mb-2">
              <HeartHandshake className="w-5 h-5 text-gold-600" />
              Elderly Concierge
            </div>
            <p className="text-xs text-temple-600 leading-relaxed">
              Need wheelchair escort, senior citizen battery car transit, or prasad parcel assistance? Submit a concierge request below.
            </p>
          </div>
        </div>

        {/* Support Request Form */}
        <div className="md:col-span-2 card p-6">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="font-display text-xl font-bold text-temple-800">Request Received</h2>
              <p className="text-xs text-temple-600 max-w-sm mx-auto">
                Our Guruvayoor ground support team has received your ticket and will call your registered phone number shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ category: 'HOTEL_ISSUE', subject: '', description: '', tripCode: '' });
                }}
                className="btn-outline text-xs mt-4"
              >
                Submit another query
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-2.5">
                Send Support Ticket
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="HOTEL_ISSUE">Hotel / Room Issue</option>
                    <option value="RIDE_ISSUE">Taxi / Ride Assistance</option>
                    <option value="GUIDE_ISSUE">Guide Service Query</option>
                    <option value="FOOD_ISSUE">Food / Sadhya Order</option>
                    <option value="LOST_ITEM">Lost Item in Temple Area</option>
                    <option value="CONCIERGE">Senior Citizen Concierge</option>
                    <option value="OTHER">General Pilgrimage Help</option>
                  </select>
                </div>

                <div>
                  <label className="label">Trip ID / Booking Code (Optional)</label>
                  <input
                    className="input font-mono uppercase"
                    value={formData.tripCode}
                    onChange={(e) => setFormData({ ...formData, tripCode: e.target.value })}
                    placeholder="e.g. GV-2026-XXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="label">Subject</label>
                <input
                  className="input"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Need early check-in at hotel / Taxi delay"
                  required
                />
              </div>

              <div>
                <label className="label">Description / Details</label>
                <textarea
                  className="input h-28"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain your situation in detail so our local team can resolve it immediately..."
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs py-2.5 px-6 font-bold"
                >
                  {loading ? 'Submitting...' : 'Send Help Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
