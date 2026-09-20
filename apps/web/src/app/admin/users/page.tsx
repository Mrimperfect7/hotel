'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';

type User = { id: string; name: string; email: string; phone: string | null; role: string; isBlocked: boolean; createdAt: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState('');

  const load = useCallback(() => {
    api.get<{ users: User[] }>(`/api/admin/users${role ? `?role=${role}` : ''}`, true)
      .then((r) => setUsers(r.users)).catch(() => {});
  }, [role]);

  useEffect(load, [load]);

  async function toggle(user: User) {
    await api.patch(`/api/admin/users/${user.id}/block`, { blocked: !user.isBlocked }, true);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-temple-700">Users</h1>
        <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="HOTEL_OWNER">Hotel owners</option>
        </select>
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
    </div>
  );
}
