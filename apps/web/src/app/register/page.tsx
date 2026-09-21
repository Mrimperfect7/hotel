'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError, setTokens } from '@/lib/api';
import { Eye, EyeOff, UserPlus, Building2, Luggage } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'CUSTOMER' | 'HOTEL_OWNER'>('CUSTOMER');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="card p-8 shadow-xl border border-temple-100 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-600">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-temple-800">Create account</h1>
            <p className="text-sm text-temple-500">Join the Guruvayoor Go platform.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['CUSTOMER', 'HOTEL_OWNER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-xl border p-3 flex flex-col items-center justify-center gap-2 text-sm font-semibold transition-all ${role === r ? 'border-temple-600 bg-temple-50 text-temple-800 ring-1 ring-temple-600/20' : 'border-temple-200 text-temple-500 hover:border-temple-300 hover:bg-temple-50/50'}`}
            >
              {r === 'CUSTOMER' ? <Luggage className={`w-5 h-5 ${role === r ? 'text-temple-600' : 'text-temple-400'}`} /> : <Building2 className={`w-5 h-5 ${role === r ? 'text-temple-600' : 'text-temple-400'}`} />}
              {r === 'CUSTOMER' ? 'I travel & book' : 'I own a service'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Full name</label>
            <input className="input w-full focus:ring-gold-500/30 focus:border-gold-500" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Email</label>
            <input className="input w-full focus:ring-gold-500/30 focus:border-gold-500" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Phone (Indian mobile)</label>
            <input className="input w-full focus:ring-gold-500/30 focus:border-gold-500" required placeholder="98XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label text-temple-700 font-medium mb-1.5 block">Password <span className="text-xs font-normal text-temple-400">(min 8 chars, letter + digit)</span></label>
            <div className="relative">
              <input 
                className="input w-full pr-10 focus:ring-gold-500/30 focus:border-gold-500" 
                type={showPassword ? 'text' : 'password'} 
                required 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
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
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-temple-500">
          Already registered? <Link href="/login" className="font-semibold text-gold-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
