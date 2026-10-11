'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { User, Phone, Mail, Globe, Heart, CheckCircle, Save } from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function CustomerProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lang, setLang] = useState('en');
  const [seniorFriendly, setSeniorFriendly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api
      .get<{ user: UserData }>('/api/auth/me', true)
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          setName(res.user.name || '');
          setPhone(res.user.phone || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.patch('/api/auth/me', { name, phone, preferredLang: lang, seniorFriendly }, true);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
          <User className="w-7 h-7 text-gold-600" /> Devotee Profile & Preferences
        </h1>
        <p className="text-sm text-temple-500 mt-1">
          Manage your personal pilgrim profile and darshan assistance requirements.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3">
            Account Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Registered Email (Login ID)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-temple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9 bg-temple-50 cursor-not-allowed text-temple-600"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <span className="text-[11px] text-temple-400">Email address cannot be modified.</span>
            </div>

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-temple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Menon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Phone / WhatsApp Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-temple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-9"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-600" /> Travel Preferences
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Preferred Language</label>
              <select
                className="input"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="ml">Malayalam (മലയാളം)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="en">English</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="te">Telugu (తెలుగు)</option>
              </select>
            </div>

            <div className="pt-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="seniorFriendly"
                  checked={seniorFriendly}
                  onChange={(e) => setSeniorFriendly(e.target.checked)}
                  className="rounded text-gold-600 focus:ring-gold-500 w-5 h-5 mt-0.5"
                />
                <label htmlFor="seniorFriendly" className="text-sm cursor-pointer">
                  <span className="font-bold text-temple-800 block flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" /> Traveling with Senior Citizens / Elderly Parents
                  </span>
                  <span className="text-xs text-temple-500 block mt-0.5">
                    We will prioritize ground-floor rooms with lifts, wheelchair accessible hotel entries, and direct queue guidance.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {savedSuccess && (
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Profile saved successfully!
            </p>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
