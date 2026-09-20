'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Log = {
  id: string; actorRole: string | null; action: string; entity: string; entityId: string | null;
  ip: string | null; createdAt: string; actor?: { name: string } | null;
  metadata?: Record<string, unknown> | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    api.get<{ logs: Log[] }>('/api/admin/audit', true).then((r) => setLogs(r.logs)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-temple-700">Audit log</h1>
      <p className="text-sm text-temple-500">Every privileged action is recorded immutably — who, what, when, from where.</p>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-temple-100 text-[11px] uppercase tracking-wide text-temple-400">
              <th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th>
              <th className="p-3">Entity</th><th className="p-3">IP</th><th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-temple-50 align-top">
                <td className="p-3 whitespace-nowrap text-temple-500">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                <td className="p-3">{l.actor?.name ?? '—'}<div className="text-[11px] text-temple-400">{l.actorRole}</div></td>
                <td className="p-3"><span className="badge bg-temple-50 text-temple-700">{l.action}</span></td>
                <td className="p-3 text-temple-500">{l.entity}<div className="font-mono text-[11px] text-temple-300">{l.entityId?.slice(0, 8)}</div></td>
                <td className="p-3 text-temple-400">{l.ip ?? '—'}</td>
                <td className="p-3 font-mono text-[11px] text-temple-400">{l.metadata ? JSON.stringify(l.metadata).slice(0, 90) : '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-temple-400">No audit entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
