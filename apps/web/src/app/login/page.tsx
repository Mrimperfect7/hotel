'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, ApiError, setTokens } from '@/lib/api';
import { Eye, EyeOff, LogIn } from 'lucide-react';

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="card p-8 shadow-xl border border-temple-100 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-600">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-temple-800">Welcome back</h1>
            <p className="text-sm text-temple-500">Sign in to manage your journey.</p>
          </div>
        </div>
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Email or phone</label>
            <input 
              className="input w-full focus:ring-gold-500/30 focus:border-gold-500" 
              required 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
            />
          </div>
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input 
                className="input w-full pr-10 focus:ring-gold-500/30 focus:border-gold-500" 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-temple-400 hover:text-temple-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          <button disabled={busy} className="btn-primary w-full py-3 shadow-lg shadow-gold-500/20 mt-2">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
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
