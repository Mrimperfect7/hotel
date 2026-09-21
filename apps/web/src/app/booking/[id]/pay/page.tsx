'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError, getToken } from '@/lib/api';
import { formatINR } from '@/lib/format';
import { QRCodeSVG } from 'qrcode.react';

export default function PayPage() {
  const { id } = useParams() as { id: string };
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentData, setPaymentData] = useState<{ paymentId: string; upiUri: string; amountPaise: number } | null>(null);
  const [utr, setUtr] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedIn = Boolean(getToken());

  useEffect(() => {
    if (!id) return;
    setBusy(true);
    api.post<{ paymentId: string; upiUri: string; amountPaise: number }>('/api/payments/create', { bookingId: id }, loggedIn)
      .then((res) => {
        setPaymentData(res);
        setPaymentStep(true);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Error generating payment link.');
      })
      .finally(() => {
        setLoading(false);
        setBusy(false);
      });
  }, [id, loggedIn]);

  async function confirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentData || utr.length < 12) return;
    setBusy(true);
    try {
      await api.post('/api/payments/confirm', {
        paymentId: paymentData.paymentId,
        utr,
      }, loggedIn);
      window.location.href = `/my-bookings`;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error verifying payment.');
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-xl px-4 py-16 text-center text-temple-500 animate-pulse">Loading payment details...</div>;
  }

  if (error && !paymentStep) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-temple-700">Unable to pay</h1>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-temple-700 mb-2">Pay via UPI</h1>
      <p className="text-temple-600 mb-6">Scan the QR code below with GPay, PhonePe, or Paytm to complete your booking.</p>
      
      {paymentData && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-temple-100 flex flex-col items-center">
          <QRCodeSVG value={paymentData.upiUri} size={200} />
          <p className="mt-4 text-xl font-bold text-temple-900">{formatINR(paymentData.amountPaise)}</p>
          
          <a href={paymentData.upiUri} className="mt-4 btn bg-kerala-500 text-white w-full py-2 block md:hidden">
            Open UPI App
          </a>
        </div>
      )}

      <form onSubmit={confirmPayment} className="mt-8 card p-6 text-left">
        <h2 className="font-bold text-temple-700 mb-2">Enter UTR / Reference No.</h2>
        <p className="text-xs text-temple-500 mb-4">After paying, enter the 12-digit UPI Reference number to confirm your booking.</p>
        
        <input 
          type="text" 
          required 
          minLength={12} 
          maxLength={20}
          placeholder="e.g. 3145XXXXXXXX" 
          className="input w-full text-center text-lg tracking-widest font-mono"
          value={utr}
          onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
        />
        
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button disabled={busy || utr.length < 12} type="submit" className="btn-gold mt-4 w-full py-3">
          {busy ? 'Verifying...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}
