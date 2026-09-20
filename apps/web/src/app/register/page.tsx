'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError, setTokens } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CUSTOMER' | 'HOTEL_OWNER'>('CUSTOMER');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: { role: string } }>(
        '/api/auth/register', { ...form, role }
      );
      setTokens(res.accessToken, res.refreshToken);
      router.push(role === 'HOTEL_OWNER' ? '/owner' : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-8">
        <h1 className="font-display text-2xl font-bold text-temple-700">Create your account</h1>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['CUSTOMER', 'HOTEL_OWNER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border p-3 text-sm font-semibold ${role === r ? 'border-temple-600 bg-temple-50 text-temple-700' : 'border-temple-200 text-temple-500'}`}
            >
              {r === 'CUSTOMER' ? '🧳 I travel & book' : '🏨 I own a hotel'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone (Indian mobile)</label>
            <input className="input" required placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Password (min 8 chars, letter + digit)</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-temple-500">
          Already registered? <Link href="/login" className="font-semibold text-gold-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
