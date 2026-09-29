'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Subscriber = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ subscribers: Subscriber[] }>('/api/admin/subscribers', true)
      .then((res) => setSubscribers(res.subscribers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-temple-500">Loading subscribers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-temple-900">Marketing Subscribers</h1>
          <p className="text-sm text-temple-600">
            Manage users who have opted in for exclusive WhatsApp offers.
          </p>
        </div>
        <div className="text-sm font-medium text-temple-600 bg-temple-50 px-3 py-1 rounded-full border border-temple-100">
          Total: {subscribers.length}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-temple-50 text-temple-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">WhatsApp</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-temple-100">
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-temple-500">
                  No subscribers found yet.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-temple-50/50">
                  <td className="px-4 py-3 font-medium text-temple-900">
                    {sub.name}
                    {sub.email && <div className="text-xs text-temple-500 font-normal">{sub.email}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-temple-700">{sub.whatsapp}</td>
                  <td className="px-4 py-3 text-temple-700">{sub.city || '-'}</td>
                  <td className="px-4 py-3">
                    {sub.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        Opted Out
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-temple-500">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
