import Link from 'next/link';
import { formatINR } from '@/lib/format';
import { travelText } from '@/lib/format';

export type HotelCardData = {
  id: string;
  slug: string;
  name: string;
  coverImage: string | null;
  distanceMeters: number | null;
  rating: number;
  reviewCount: number;
  minPricePaise: number;
  roomTypes: Array<{ name: string; pricePaise: number; ac: boolean }>;
  amenities: string[];
  isFeatured: boolean;
};

export function HotelCard({ hotel }: { hotel: HotelCardData }) {
  return (
    <article className="card overflow-hidden transition hover:shadow-lift">
      <Link href={`/hotels/${hotel.slug}`} className="block">
        <div className="relative h-48 w-full overflow-hidden bg-temple-100">
          {hotel.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotel.coverImage} alt={hotel.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="grid h-full place-items-center text-4xl">🛕</div>
          )}
          {hotel.isFeatured && (
            <span className="badge absolute left-3 top-3 bg-gold-500 text-temple-900">★ Featured</span>
          )}
          {hotel.rating > 0 && (
            <span className="badge absolute right-3 top-3 bg-temple-600 text-white">
              {hotel.rating.toFixed(1)}{hotel.reviewCount > 0 ? ` · ${hotel.reviewCount}` : ''}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/hotels/${hotel.slug}`}>
              <h3 className="font-display text-lg font-bold text-temple-700 hover:text-gold-600">{hotel.name}</h3>
            </Link>
            <p className="mt-0.5 text-xs font-medium text-kerala-600">
              🛕 {travelText(hotel.distanceMeters)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-temple-700">{formatINR(hotel.minPricePaise)}</div>
            <div className="text-[11px] text-temple-400">per night · +tax</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {hotel.roomTypes.slice(0, 3).map((r) => (
            <span key={r.name} className="badge bg-temple-50 text-temple-600">
              {r.name}{r.ac ? ' · AC' : ''}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/hotels/${hotel.slug}`} className="btn-outline flex-1">View Rooms</Link>
          <Link
            href={`/hotels/${hotel.slug}#book`}
            className="btn-gold flex-1"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
