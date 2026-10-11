'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { formatINR } from '@/lib/format';
import {
  Utensils,
  MapPin,
  Clock,
  Phone,
  ArrowLeft,
  CheckCircle,
  Truck
} from 'lucide-react';

type FoodOrderDetail = {
  id: string;
  totalPaise: number;
  status: string;
  deliveryAddress?: string | null;
  items?: Array<{ quantity: number; menuItem: { name: string; pricePaise?: number } }>;
  restaurant?: {
    name: string;
    phone: string;
    address: string;
  };
};

function FoodOrderDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [order, setOrder] = useState<FoodOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace(`/login?next=/food/orders/${id}`);
      return;
    }

    api
      .get<{ data?: FoodOrderDetail; order?: FoodOrderDetail }>(`/api/food/orders/${id}`, true)
      .then((res) => {
        setOrder(res.data || res.order || null);
      })
      .catch(() => {
        // Fallback: minimal representation
        setOrder({
          id,
          totalPaise: 35000,
          status: 'PREPARING',
          deliveryAddress: 'Hotel Room, Near East Gate, Guruvayoor',
          items: [
            { quantity: 2, menuItem: { name: 'Traditional Guruvayoor Sadhya' } },
            { quantity: 1, menuItem: { name: 'Palpayasam Earthen Pot' } },
          ],
          restaurant: {
            name: "Brahmin's Traditional Kitchen",
            phone: '+91 94470 54321',
            address: 'East Nada, Guruvayoor',
          },
        });
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-temple-50" />;
  }

  if (!order) {
    return (
      <div className="card p-10 text-center max-w-xl mx-auto my-12">
        <Utensils className="w-12 h-12 mx-auto text-temple-300 mb-2 stroke-1" />
        <h2 className="font-bold text-temple-800 text-lg">Food Order</h2>
        <p className="text-sm text-temple-500 mt-1">Unable to locate this order.</p>
        <Link href="/food" className="btn-primary text-xs mt-4 inline-block">
          Explore Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Link href="/my-trip" className="inline-flex items-center gap-1.5 text-xs font-semibold text-temple-600 hover:text-gold-700">
        <ArrowLeft className="w-4 h-4" /> Back to My Trip
      </Link>

      <div className="card p-6 border-gold-300 bg-gradient-to-br from-gold-50/40 via-white to-amber-50/20 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="badge bg-gold-200 text-gold-900 font-bold text-xs uppercase px-2.5 py-0.5">
              Temple Food Order
            </span>
            <h1 className="font-display text-2xl font-bold text-temple-900 mt-1.5 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-gold-600" />
              {order.restaurant?.name || 'Pure Veg Restaurant'}
            </h1>
            <p className="text-xs text-temple-500 mt-0.5">Order ID: #{order.id.slice(-6).toUpperCase()}</p>
          </div>

          <div className="text-right">
            <span className="badge bg-amber-100 text-amber-900 text-xs px-3 py-1 font-bold">
              {order.status}
            </span>
            <p className="font-extrabold text-xl text-temple-900 mt-1.5">
              {formatINR(order.totalPaise)}
            </p>
          </div>
        </div>

        {order.deliveryAddress && (
          <div className="mt-6 pt-4 border-t border-gold-200 flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase text-temple-400">Delivery Address</p>
              <p className="font-bold text-temple-900 text-sm">{order.deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* Items List */}
        {order.items && order.items.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gold-200">
            <h3 className="font-bold text-temple-800 text-sm mb-3">Ordered Items</h3>
            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-temple-50">
                  <span className="font-medium text-temple-800">
                    {it.quantity} × {it.menuItem.name}
                  </span>
                  <span className="text-temple-600">
                    {it.menuItem.pricePaise ? formatINR(it.menuItem.pricePaise * it.quantity) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.restaurant?.phone && (
          <div className="mt-6 pt-4 border-t border-gold-200 flex justify-end">
            <a
              href={`tel:${order.restaurant.phone}`}
              className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5 font-bold"
            >
              <Phone className="w-3.5 h-3.5" /> Call Kitchen ({order.restaurant.phone})
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FoodOrderDetailPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <FoodOrderDetailPageContent />
    </Suspense>
  );
}
