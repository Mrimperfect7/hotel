'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  Languages,
  DollarSign,
  FileText,
  Save,
  Sparkles
} from 'lucide-react';

type GuideData = {
  id: string;
  name: string;
  phone: string;
  languages: string[];
  experienceYears: number;
  specialization?: string | null;
  description?: string | null;
  serviceArea?: string | null;
  hourlyPricePaise: number;
  halfDayPricePaise: number;
  fullDayPricePaise: number;
  upiId?: string | null;
  status: string;
};

type Dash = {
  guide: GuideData;
};

const POPULAR_LANGUAGES = ['Malayalam', 'Tamil', 'Hindi', 'English', 'Kannada', 'Telugu'];

function GuideProfileContent() {
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Malayalam', 'English']);
  const [experienceYears, setExperienceYears] = useState(3);
  const [specialization, setSpecialization] = useState('Guruvayoor Temple Darshan & Rituals');
  const [description, setDescription] = useState('');
  const [serviceArea, setServiceArea] = useState('Guruvayoor East Nada & Temple Premises');
  const [hourlyPrice, setHourlyPrice] = useState(300);
  const [halfDayPrice, setHalfDayPrice] = useState(800);
  const [fullDayPrice, setFullDayPrice] = useState(1500);
  const [upiId, setUpiId] = useState('');

  const loadProfile = () => {
    setLoading(true);
    api
      .get<Dash>('/api/guides/dashboard', true)
      .then((res) => {
        if (res.guide) {
          const g = res.guide;
          setGuide(g);
          setPhone(g.phone || '');
          setLanguages(g.languages || ['Malayalam', 'English']);
          setExperienceYears(g.experienceYears || 0);
          setSpecialization(g.specialization || 'Temple Rituals & Senior Citizen Darshan');
          setDescription(g.description || '');
          setServiceArea(g.serviceArea || 'Guruvayoor Temple');
          setHourlyPrice(Math.round((g.hourlyPricePaise || 0) / 100));
          setHalfDayPrice(Math.round((g.halfDayPricePaise || 0) / 100));
          setFullDayPrice(Math.round((g.fullDayPricePaise || 0) / 100));
          setUpiId(g.upiId || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.patch(
        '/api/guides/profile',
        {
          phone,
          languages,
          experienceYears: Number(experienceYears),
          specialization,
          description,
          serviceArea,
          hourlyPricePaise: Math.round(Number(hourlyPrice) * 100),
          halfDayPricePaise: Math.round(Number(halfDayPrice) * 100),
          fullDayPricePaise: Math.round(Number(fullDayPrice) * 100),
          upiId,
        },
        true
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Error saving guide profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !guide) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  const isApproved = guide?.status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <User className="w-7 h-7 text-gold-600" /> Guide Profile & Darshan Services
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Configure your guiding languages, temple specialties, and devotee dakshina pricing.
          </p>
        </div>
        <Link href="/guide" className="btn-outline text-xs py-2 px-3">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Status banner */}
      <div
        className={`card p-4 flex items-center justify-between gap-4 ${
          isApproved
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-gold-300 bg-gold-50 text-gold-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {isApproved ? (
            <Shield className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-gold-600 shrink-0" />
          )}
          <div>
            <p className="font-bold text-sm">
              Guide Profile Status: {guide?.status || 'PENDING'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isApproved
                ? 'Your guide account is certified. Pilgrims can view your profile and book darshan assistance.'
                : 'Your profile is awaiting verification by the Guruvayoor platform admin team.'}
            </p>
          </div>
        </div>
        <span
          className={`badge font-bold px-3 py-1 ${
            isApproved ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-white'
          }`}
        >
          {guide?.status || 'PENDING'}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Profile */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-600" /> Personal & Contact Details
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Guide Name (Official)</label>
              <input
                className="input bg-temple-50 cursor-not-allowed"
                value={guide?.name || ''}
                disabled
              />
              <span className="text-[11px] text-temple-400">
                Managed from main account login.
              </span>
            </div>

            <div>
              <label className="label">Contact Phone / WhatsApp</label>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div>
              <label className="label">Experience (Years)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="label">Primary Service Area</label>
              <input
                className="input"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Guruvayoor East Nada, Mammiyoor Temple"
              />
            </div>
          </div>
        </div>

        {/* Languages & Specialization */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <Languages className="w-5 h-5 text-gold-600" /> Languages & Guiding Expertise
          </h2>

          <div>
            <label className="label">Languages Spoken with Pilgrims</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {POPULAR_LANGUAGES.map((lang) => {
                const active = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`badge px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-temple-600 text-white shadow-sm ring-1 ring-temple-600'
                        : 'bg-white text-temple-600 ring-1 ring-temple-200 hover:bg-temple-50'
                    }`}
                  >
                    {active ? '✓ ' : '+ '} {lang}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Specialization / Focus Areas</label>
            <input
              className="input"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Senior citizen darshan, Temple history, Thulabharam & Annaprasanam"
            />
          </div>

          <div>
            <label className="label">About You / Devotee Introduction</label>
            <textarea
              className="input h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell pilgrims about your background, familiarity with temple rituals, and how you assist them during darshan..."
            />
          </div>
        </div>

        {/* Pricing & UPI */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base border-b border-temple-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold-600" /> Guiding Rates & Payout Details
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Hourly Rate (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={hourlyPrice}
                onChange={(e) => setHourlyPrice(Number(e.target.value))}
                placeholder="300"
                required
              />
            </div>

            <div>
              <label className="label">Half-Day Rate (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={halfDayPrice}
                onChange={(e) => setHalfDayPrice(Number(e.target.value))}
                placeholder="800"
                required
              />
            </div>

            <div>
              <label className="label">Full-Day Rate (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                value={fullDayPrice}
                onChange={(e) => setFullDayPrice(Number(e.target.value))}
                placeholder="1500"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="label">Direct UPI ID for Dakshina / Payments</label>
            <input
              className="input font-mono"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
            />
            <span className="text-[11px] text-temple-400">
              Devotees can send dakshina directly to this verified UPI ID.
            </span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Guide profile saved successfully!
            </p>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Guide Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GuideProfilePage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <GuideProfileContent />
    </Suspense>
  );
}
