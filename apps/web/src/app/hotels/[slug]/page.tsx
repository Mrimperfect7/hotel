import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatINR, travelText } from '@/lib/format';

const API = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

type Amenity = { id: string; label: string; icon: string };
type RoomType = {
  id: string; name: string; description: string | null; basePricePaise: number;
  maxOccupancy: number; bedType: string; roomSizeSqft: number | null; acAvailable: boolean;
  availableNow: number; images: Array<{ url: string }> | null;
  amenities: Amenity[];
};
type Hotel = {
  id: string; slug: string; name: string; description: string | null;
  addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string;
  lat: number; lng: number; distanceMeters: number | null;
  checkInTime: string; checkOutTime: string; cancellationPolicyText: string; hotelRules: string | null;
  starRating: number; ratingAvg: number; reviewCount: number;
  contactPhone: string; contactEmail: string;
  images: Array<{ id: string; url: string; altText: string | null }>;
  amenities: Amenity[];
  roomTypes: RoomType[];
  reviews: Array<{ id: string; overall: number; comment: string | null; customerName: string; createdAt: string; response: string | null }>;
};

async function getHotel(slug: string): Promise<Hotel | null> {
  const res = await fetch(`${API}/api/hotels/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.hotel as Hotel;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const hotel = await getHotel(params.slug);
  if (!hotel) return { title: 'Hotel not found' };
  const title = `${hotel.name}, Guruvayoor — ${hotel.distanceMeters != null ? `${Math.round(hotel.distanceMeters)} m from Temple` : 'near Guruvayoor Temple'}`;
  return {
    title,
    description: hotel.description?.slice(0, 155) ?? `Book ${hotel.name} near Guruvayoor Sri Krishna Temple. Verified property, direct hotel confirmation.`,
    alternates: { canonical: `/hotels/${hotel.slug}` },
    openGraph: {
      title,
      images: hotel.images[0] ? [{ url: hotel.images[0].url }] : undefined,
    },
  };
}

export default async function HotelDetailPage({ params }: { params: { slug: string } }) {
  const hotel = await getHotel(params.slug);
  if (!hotel) notFound();

  // Hotel schema.org structured data for rich results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.addressLine1,
      addressLocality: hotel.city,
      addressRegion: hotel.state,
      postalCode: hotel.pincode,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: hotel.lat, longitude: hotel.lng },
    telephone: hotel.contactPhone,
    starRating: hotel.starRating ? { '@type': 'Rating', ratingValue: hotel.starRating } : undefined,
    aggregateRating: hotel.reviewCount > 0
      ? { '@type': 'AggregateRating', ratingValue: hotel.ratingAvg, reviewCount: hotel.reviewCount }
      : undefined,
    priceRange: hotel.roomTypes.length
      ? `₹${Math.min(...hotel.roomTypes.map((r) => r.basePricePaise / 100))}–₹${Math.max(...hotel.roomTypes.map((r) => r.basePricePaise / 100))}`
      : undefined,
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Hotels', item: '/hotels' },
      { '@type': 'ListItem', position: 3, name: hotel.name, item: `/hotels/${hotel.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav className="text-xs text-temple-400">
        <Link href="/">Home</Link> · <Link href="/hotels">Hotels</Link> · <span className="text-temple-600">{hotel.name}</span>
      </nav>

      {/* Gallery */}
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="md:col-span-2">
          {hotel.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotel.images[0].url} alt={hotel.name} className="h-72 w-full rounded-2xl object-cover md:h-96" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
          {hotel.images.slice(1, 3).map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt={img.altText ?? hotel.name} className="h-32 w-full rounded-xl object-cover md:h-[11.4rem]" />
          ))}
        </div>
      </div>

      {/* Header */}
      <section className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-temple-700">
            {hotel.name}
            <span className="badge ml-2 bg-kerala-100 text-kerala-700">✔ Verified</span>
          </h1>
          <p className="mt-1 text-sm text-temple-500">
            📍 {hotel.addressLine1}, {hotel.city}, {hotel.state} — {hotel.pincode}
          </p>
          <p className="mt-1 text-sm font-semibold text-kerala-600">🛕 {travelText(hotel.distanceMeters)}</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-temple-700">
            {formatINR(Math.min(...hotel.roomTypes.map((r) => r.basePricePaise), Number.MAX_SAFE_INTEGER))}
          </div>
          <div className="text-[11px] text-temple-400">starting / night · +tax</div>
          <a href="#book" className="btn-gold mt-2">Book Now</a>
        </div>
      </section>

      {/* Description + map */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {hotel.description && <p className="text-temple-700">{hotel.description}</p>}

          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-temple-700">Amenities</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {hotel.amenities.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-temple-600">
                  <span>{a.icon}</span> {a.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rooms */}
          <div id="book" className="space-y-4">
            <h2 className="font-display text-xl font-bold text-temple-700">Choose your room</h2>
            {hotel.roomTypes.map((room) => (
              <div key={room.id} className="card overflow-hidden md:flex">
                <div className="h-40 md:h-auto md:w-56 bg-temple-100">
                  {room.images?.[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={room.images[0].url} alt={room.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-bold text-temple-700">{room.name}</h3>
                    <p className="mt-1 text-xs text-temple-500">
                      🛏️ {room.bedType} · 👤 up to {room.maxOccupancy} guests
                      {room.roomSizeSqft ? ` · ${room.roomSizeSqft} sq ft` : ''} · {room.acAvailable ? '❄️ AC' : '🌤 Non-AC'}
                    </p>
                    {room.amenities.length > 0 && (
                      <p className="mt-1 text-xs text-temple-400">
                        {room.amenities.map((a) => a.label).join(' · ')}
                      </p>
                    )}
                    <p className={`mt-2 text-xs font-semibold ${room.availableNow > 2 ? 'text-kerala-600' : room.availableNow > 0 ? 'text-gold-600' : 'text-red-600'}`}>
                      {room.availableNow > 0 ? `Only ${room.availableNow} left today` : 'Sold out'}
                    </p>
                  </div>
                  <div className="mt-3 text-right md:mt-0">
                    <div className="text-xl font-bold text-temple-700">{formatINR(room.basePricePaise)}</div>
                    <div className="text-[11px] text-temple-400">per night · +tax</div>
                    <Link href={`/booking?hotel=${hotel.id}&room=${room.id}`} className="btn-primary mt-2">Book This Room</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews */}
          {hotel.reviews.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display text-lg font-bold text-temple-700">
                Guest reviews <span className="text-sm font-normal text-temple-400">({hotel.reviewCount})</span>
              </h2>
              <div className="mt-4 space-y-4">
                {hotel.reviews.map((r) => (
                  <div key={r.id} className="border-b border-temple-50 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-temple-700">{r.customerName}</span>
                      <span className="badge bg-gold-100 text-gold-800">{'★'.repeat(r.overall)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-temple-600">{r.comment}</p>}
                    {r.response && (
                      <p className="mt-2 rounded-lg bg-temple-50 p-2 text-xs text-temple-600">
                        <strong>Hotel response:</strong> {r.response}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <iframe
              title={`Map of ${hotel.name}`}
              className="h-48 w-full border-0"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${hotel.lat},${hotel.lng}&z=15&output=embed`}
            />
            <div className="p-4">
              <a
                className="btn-outline w-full"
                href={`https://www.google.com/maps/dir/?api=1&destination=${hotel.lat},${hotel.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                🧭 Get Directions
              </a>
            </div>
          </div>
          <div className="card p-5 text-sm">
            <h3 className="font-bold text-temple-700">Check-in / Check-out</h3>
            <p className="mt-1 text-temple-600">Check-in from {hotel.checkInTime} · Check-out till {hotel.checkOutTime}</p>
            <h3 className="mt-4 font-bold text-temple-700">Cancellation</h3>
            <p className="mt-1 text-temple-600">{hotel.cancellationPolicyText}</p>
            {hotel.hotelRules && (
              <>
                <h3 className="mt-4 font-bold text-temple-700">Hotel rules</h3>
                <p className="mt-1 whitespace-pre-line text-temple-600">{hotel.hotelRules}</p>
              </>
            )}
            <h3 className="mt-4 font-bold text-temple-700">Contact hotel</h3>
            <p className="mt-1 text-temple-600">📞 {hotel.contactPhone}</p>
            <a href={`tel:${hotel.contactPhone}`} className="btn-outline mt-2 w-full">Call Hotel</a>
          </div>
        </aside>
      </section>
    </div>
  );
}
