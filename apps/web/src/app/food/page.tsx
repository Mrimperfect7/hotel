import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from 'next/link';

export default function FoodPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-temple-50/50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="font-display text-3xl font-bold text-temple-800">Food Near You</h1>
            <Link href="/list-your-service" className="text-sm font-semibold text-gold-600">Add your restaurant</Link>
          </div>
          
          <div className="card p-8 text-center bg-white border border-temple-100">
            <div className="text-5xl mb-4">🍛</div>
            <h2 className="text-xl font-bold text-temple-800">Food Delivery Coming Soon</h2>
            <p className="mt-2 text-temple-600">Discover pure veg restaurants and local delicacies.</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
