'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Car,
  User,
  Shield,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Phone,
  FileText,
  Save
} from 'lucide-react';

type Document = {
  id: string;
  docType: string;
  status: string;
};

type DriverData = {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  serviceArea: string | null;
  status: string;
  isOnline: boolean;
  vehicle?: {
    type: string;
    number: string;
    model: string | null;
  } | null;
  documents?: Document[];
};

type Dash = {
  driver: DriverData;
};

function DriverProfileContent() {
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [vehicleType, setVehicleType] = useState('Auto');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  const loadProfile = () => {
    setLoading(true);
    api
      .get<Dash>('/api/rides/dashboard', true)
      .then((res) => {
        if (res.driver) {
          setDriver(res.driver);
          setPhone(res.driver.phone || '');
          setLicenseNumber(res.driver.licenseNumber || '');
          setServiceArea(res.driver.serviceArea || 'Guruvayoor & Surrounding Areas');
          if (res.driver.vehicle) {
            setVehicleType(res.driver.vehicle.type || 'Auto');
            setVehicleNumber(res.driver.vehicle.number || '');
            setVehicleModel(res.driver.vehicle.model || '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.patch(
        '/api/rides/profile',
        {
          phone,
          licenseNumber,
          serviceArea,
          vehicleType,
          vehicleNumber,
          vehicleModel,
        },
        true
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadClick = (docType: string) => {
    setUploadingDoc(docType);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDoc) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', uploadingDoc);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      await fetch(`${apiUrl}/api/rides/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      alert('Document uploaded successfully! Verification pending.');
      loadProfile();
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && !driver) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  const isApproved = driver?.status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp, application/pdf"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <User className="w-7 h-7 text-gold-600" /> Driver & Vehicle Profile
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Maintain your driver details, taxi information, and verification documents.
          </p>
        </div>
        <Link href="/driver" className="btn-outline text-xs py-2 px-3">
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
              Account Status: {driver?.status || 'PENDING'}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {isApproved
                ? 'Your driver credentials and vehicle documents are verified. You are active on Guruvayoor Rides.'
                : 'Your profile is awaiting administrative verification. Make sure your Driving License and RC are uploaded.'}
            </p>
          </div>
        </div>
        <span
          className={`badge font-bold px-3 py-1 ${
            isApproved ? 'bg-emerald-600 text-white' : 'bg-gold-500 text-white'
          }`}
        >
          {driver?.status || 'PENDING'}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Driver Details Section */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base flex items-center gap-2 border-b border-temple-100 pb-3">
            <User className="w-5 h-5 text-gold-600" /> Driver Information
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Driver Full Name (Official)</label>
              <input
                className="input bg-temple-50 cursor-not-allowed"
                value={driver?.name || ''}
                disabled
              />
              <span className="text-[11px] text-temple-400">
                Managed from main authentication profile.
              </span>
            </div>

            <div>
              <label className="label">Phone / WhatsApp Number</label>
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
              <label className="label">Driving License Number</label>
              <input
                className="input"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="KL-46-2019-XXXXXX"
                required
              />
            </div>

            <div>
              <label className="label">Primary Service Area</label>
              <input
                className="input"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Guruvayoor, Chavakkad, Temple Ring Road"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Details Section */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-temple-800 text-base flex items-center gap-2 border-b border-temple-100 pb-3">
            <Car className="w-5 h-5 text-gold-600" /> Vehicle Information
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Vehicle Type</label>
              <select
                className="input"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="Auto">Auto Rickshaw</option>
                <option value="Electric Auto">EV Auto</option>
                <option value="Sedan">Sedan (Dzire / Etios)</option>
                <option value="SUV">SUV (Innova / Ertiga)</option>
                <option value="Van">Traveller / Mini Van</option>
              </select>
            </div>

            <div>
              <label className="label">Registration Plate Number</label>
              <input
                className="input font-mono uppercase"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="KL-46-H-1234"
                required
              />
            </div>

            <div>
              <label className="label">Model & Make</label>
              <input
                className="input"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Bajaj RE / Swift Dzire"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Changes saved successfully!
            </p>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Verification Documents Section */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-temple-800 text-base flex items-center gap-2 border-b border-temple-100 pb-3">
          <FileText className="w-5 h-5 text-gold-600" /> Verification Documents
        </h2>
        <p className="text-xs text-temple-500">
          Upload clear scanned copies or photos of your transport permits. Documents are verified by the Namma Guruvayoor safety team within 24 hours.
        </p>

        <div className="grid md:grid-cols-3 gap-4 pt-2">
          {[
            { id: 'DRIVING_LICENSE', label: 'Driving License', desc: 'Valid Kerala / Indian DL' },
            { id: 'VEHICLE_RC', label: 'Vehicle RC Book', desc: 'Commercial Registration certificate' },
            { id: 'INSURANCE', label: 'Vehicle Insurance', desc: 'Active third-party or comprehensive policy' },
          ].map((docType) => {
            const doc = driver?.documents?.find((x) => x.docType === docType.id);
            const isVerified = doc?.status === 'VERIFIED';
            const isPending = doc?.status === 'PENDING';

            return (
              <div
                key={docType.id}
                className="card p-4 bg-temple-50/50 border border-temple-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-temple-800">{docType.label}</h3>
                    {isVerified ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : isPending ? (
                      <Clock className="w-5 h-5 text-amber-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-temple-400" />
                    )}
                  </div>
                  <p className="text-xs text-temple-400 mt-1">{docType.desc}</p>
                  <p className="text-xs font-semibold mt-2">
                    {isVerified && <span className="text-emerald-700">✓ Verified</span>}
                    {isPending && <span className="text-amber-700">⏳ Pending Review</span>}
                    {!doc && <span className="text-temple-400">Not Uploaded</span>}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-temple-100">
                  <button
                    type="button"
                    onClick={() => handleUploadClick(docType.id)}
                    className="btn-outline w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {doc ? 'Re-upload' : 'Upload File'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DriverProfilePage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <DriverProfileContent />
    </Suspense>
  );
}
