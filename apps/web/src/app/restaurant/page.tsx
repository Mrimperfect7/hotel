'use client';

import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatINR, fmtDate } from '@/lib/format';

type OrderItem = { id: string; quantity: number; menuItem: { name: string } };

type Order = {
  id: string;
  status: string;
  totalPaise: number;
  deliveryAddress: string;
  customer: { name: string; phone: string };
  items: OrderItem[];
  createdAt: string;
};

type Dash = {
  restaurant: { name: string; status: string; deliveryAvailable: boolean };
  stats: { active: number; completed: number; revenuePaise: number };
  activeOrders: Order[];
  recentOrders: Order[];
};

function Dash() {
  const [d, setD] = useState<Dash | null>(null);

  const load = () => {
    api.get<Dash>('/api/food/dashboard', true).then(setD).catch(() => {});
  };

  useEffect(load, []);

  async function updateStatus(id: string, status: string) {
    await api.patch(`/api/food/orders/${id}`, { status }, true);
    load();
  }

  if (!d) return <div className="card h-48 animate-pulse bg-temple-50" />;

  return (
    <div>
      {d.restaurant.status !== 'APPROVED' && (
        <div className="card mb-6 border-red-300 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ <strong>Account not active!</strong> Your restaurant is currently {d.restaurant.status}. 
          You will not receive new food orders until an admin approves your profile.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-700">Welcome, {d.restaurant.name}</h1>
          <p className="text-sm text-temple-500">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          ['Active Orders', String(d.stats.active), '🍳'],
          ['Orders Completed', String(d.stats.completed), '✅'],
          ['Total Revenue', formatINR(d.stats.revenuePaise), '💰'],
        ].map(([label, value, icon]) => (
          <div key={label} className="card p-4">
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-xl font-bold text-temple-700">{value}</div>
            <div className="text-[11px] uppercase tracking-wide text-temple-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="font-bold text-temple-700 mb-4">Live Kitchen Display</h2>
          {d.activeOrders.length > 0 ? (
            <div className="space-y-4">
              {d.activeOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-gold-200 bg-gold-50 p-4 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${o.status === 'PLACED' ? 'bg-red-500' : 'bg-gold-500'}`} />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-temple-900">Order #{o.id.slice(-4).toUpperCase()}</p>
                      <p className="text-xs font-semibold text-temple-500">{o.customer.name} · {o.customer.phone}</p>
                    </div>
                    <span className="badge bg-white shadow-sm font-bold text-temple-700">{o.status}</span>
                  </div>

                  <ul className="text-sm font-medium text-temple-800 space-y-1 mb-4 border-t border-b border-gold-200 py-2">
                    {o.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {o.status === 'PLACED' && (
                      <button onClick={() => updateStatus(o.id, 'PREPARING')} className="btn bg-gold-500 text-white text-xs px-4">Accept & Prep</button>
                    )}
                    {o.status === 'PREPARING' && (
                      <button onClick={() => updateStatus(o.id, 'READY_FOR_PICKUP')} className="btn bg-kerala-500 text-white text-xs px-4">Mark Ready</button>
                    )}
                    {o.status === 'READY_FOR_PICKUP' && (
                      <button onClick={() => updateStatus(o.id, 'DELIVERED')} className="btn-outline text-xs px-4">Finish Delivery</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-temple-400 border border-dashed border-temple-200 rounded-xl">
              <div className="text-4xl mb-2">🍽️</div>
              <p>Kitchen is clear. Waiting for orders.</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-temple-700 mb-4">Recent Completed Orders</h2>
          {d.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-temple-400 border-b border-temple-50">
                  <tr>
                    <th className="py-2">Order</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-temple-50">
                  {d.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 font-medium text-temple-700">
                        #{o.id.slice(-4).toUpperCase()}
                        <br/>
                        <span className={`text-[10px] ${o.status === 'DELIVERED' ? 'text-kerala-600' : 'text-red-500'}`}>{o.status}</span>
                      </td>
                      <td className="py-3 text-temple-600">{o.customer.name}</td>
                      <td className="py-3 text-right font-semibold text-temple-800">{formatINR(o.totalPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-temple-400">No completed orders today.</p>
          )}
        </div>
      </div>

    </div>
  );
}

export default function RestaurantDashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dash />
    </Suspense>
  );
}
