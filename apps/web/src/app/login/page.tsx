'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, ApiError, setTokens } from '@/lib/api';

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: { role: string } }>(
        '/api/auth/login', { identifier, password }
      );
      setTokens(res.accessToken, res.refreshToken);
      const role = res.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin');
      else if (role === 'HOTEL_OWNER') router.push('/owner');
      else router.push(next);
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
        <h1 className="font-display text-2xl font-bold text-temple-700">Welcome back 🙏</h1>
        <p className="mt-1 text-sm text-temple-500">Sign in to manage your bookings or your property.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email or phone</label>
            <input className="input" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-temple-500">
          New here? <Link href="/register" className="font-semibold text-gold-700">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
