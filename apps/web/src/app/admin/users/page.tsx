'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';

type User = { id: string; name: string; email: string; phone: string | null; role: string; isBlocked: boolean; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState('');
  
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'GUIDE' });

  const load = useCallback(() => {
    api.get<{ users: User[] }>(`/api/admin/users${role ? `?role=${role}` : ''}`, true)
      .then((r) => setUsers(r.users)).catch(() => {});
  }, [role]);

  useEffect(load, [load]);

  async function toggle(user: User) {
    await api.patch(`/api/admin/users/${user.id}/block`, { blocked: !user.isBlocked }, true);
    load();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/admin/users', formData, true);
      setShowCreate(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'GUIDE' });
      load();
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-temple-700">Users</h1>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="HOTEL_OWNER">Hotel owners</option>
            <option value="GUIDE">Guides</option>
            <option value="DRIVER">Drivers</option>
            <option value="RESTAURANT_OWNER">Restaurant owners</option>
          </select>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + Create Account
          </button>
        </div>
      </div>
      
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-temple-100 text-[11px] uppercase tracking-wide text-temple-400">
              <th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Role</th>
              <th className="p-3">Joined</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-temple-50">
                <td className="p-3 font-semibold text-temple-700">{u.name}</td>
                <td className="p-3 text-temple-500">{u.email}<br />{u.phone}</td>
                <td className="p-3"><span className="badge bg-temple-50 text-temple-600">{u.role}</span></td>
                <td className="p-3 text-temple-500">{fmtDate(u.createdAt)}</td>
                <td className="p-3">
                  <span className={`badge ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-kerala-100 text-kerala-700'}`}>
                    {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                  </span>
                </td>
                <td className="p-3">
                  {u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN' && (
                    <button onClick={() => toggle(u)} className={`btn px-3 py-1 text-xs ${u.isBlocked ? 'bg-kerala-500 text-white' : 'bg-red-50 text-red-600'}`}>
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="card w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-bold text-temple-900 text-xl">Create Account</h2>
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Name</label>
                <input required type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Password</label>
                <input required type="password" minLength={6} className="input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="GUIDE">Guide</option>
                  <option value="DRIVER">Driver</option>
                  <option value="RESTAURANT_OWNER">Restaurant Owner</option>
                  <option value="HOTEL_OWNER">Hotel Owner</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn bg-temple-100 text-temple-700">Cancel</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating...' : 'Create Account'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
