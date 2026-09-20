/**
 * DEMO SEED DATA — clearly marked sample content for development.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify, haversineMeters, rupeesToPaise, generateBookingCode } from '@gsv/types';

const prisma = new PrismaClient();

const TEMPLE = { lat: 10.5945, lng: 76.2075 };

function d(offsetDays: number): Date {
  const dt = new Date();
  dt.setUTCHours(0, 0, 0, 0);
  dt.setUTCDate(dt.getUTCDate() + offsetDays);
  return dt;
}

function img(seed: string, w = 800, h = 520): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const AMENITIES = [
  { key: 'wifi', label: 'Free Wi-Fi', icon: '📶', category: 'general', sortOrder: 1 },
  { key: 'ac', label: 'Air Conditioning', icon: '❄️', category: 'room', sortOrder: 2 },
  { key: 'parking', label: 'Free Parking', icon: '🅿️', category: 'general', sortOrder: 3 },
  { key: 'breakfast', label: 'Breakfast Included', icon: '☕', category: 'general', sortOrder: 4 },
  { key: 'family_rooms', label: 'Family Rooms', icon: '👨‍👩‍👧', category: 'general', sortOrder: 5 },
  { key: 'lift', label: 'Lift / Elevator', icon: '🛗', category: 'general', sortOrder: 6 },
  { key: 'couple_friendly', label: 'Couple Friendly', icon: '💑', category: 'general', sortOrder: 7 },
  { key: 'hot_water', label: '24×7 Hot Water', icon: '🚿', category: 'room', sortOrder: 8 },
  { key: 'veg_food', label: 'Pure Veg Restaurant', icon: '🍛', category: 'general', sortOrder: 9 },
  { key: 'temple_view', label: 'Temple View', icon: '🛕', category: 'temple', sortOrder: 10 },
  { key: 'cctv', label: 'CCTV Security', icon: '🎥', category: 'safety', sortOrder: 11 },
  { key: 'power_backup', label: 'Power Backup', icon: '🔋', category: 'general', sortOrder: 12 },
  { key: 'laundry', label: 'Laundry Service', icon: '🧺', category: 'general', sortOrder: 13 },
  { key: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿', category: 'safety', sortOrder: 14 },
  { key: 'room_service', label: 'Room Service', icon: '🛎️', category: 'general', sortOrder: 15 },
  { key: 'drinking_water', label: 'Free Drinking Water', icon: '💧', category: 'temple', sortOrder: 16 },
];

type HotelSeed = {
  name: string; ownerIdx: number; desc: string; addr: string; pincode: string;
  lat: number; lng: number; star: number; featured?: boolean;
  amenities: string[]; rooms: Array<{ name: string; price: number; occ: number; bed: string; sqft?: number; ac: boolean; total: number }>;
  refund: 'FREE_CANCEL_24H' | 'FREE_CANCEL_48H' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE';
};

const HOTELS: HotelSeed[] = [
  { name: 'Sree Krishna Residency', ownerIdx: 0, desc: 'A peaceful family-run stay 300 m from the East Nada of Guruvayoor Temple. Pure vegetarian kitchen, early check-in for temple visitors.', addr: 'East Nada, Temple Road', pincode: '680101', lat: 10.5952, lng: 76.2101, star: 3, featured: true, amenities: ['wifi', 'ac', 'hot_water', 'veg_food', 'cctv', 'drinking_water', 'room_service'], refund: 'FREE_CANCEL_24H', rooms: [
    { name: 'Deluxe AC Room', price: 2200, occ: 3, bed: 'Queen', sqft: 220, ac: true, total: 8 },
    { name: 'Executive Family Room', price: 3400, occ: 5, bed: 'King + 2 Single', sqft: 340, ac: true, total: 4 },
    { name: 'Standard Non-AC Room', price: 1300, occ: 2, bed: 'Double', sqft: 160, ac: false, total: 6 },
  ]},
  { name: 'Temple Gate Inn', ownerIdx: 1, desc: 'Wake up to the temple gongs — literally steps from the temple gate. Ideal for early darshan.', addr: 'South Nada', pincode: '680101', lat: 10.5938, lng: 76.2085, star: 2, featured: true, amenities: ['wifi', 'hot_water', 'cctv', 'drinking_water', 'temple_view', 'power_backup'], refund: 'MODERATE', rooms: [
    { name: 'Temple View Double', price: 1800, occ: 2, bed: 'Double', sqft: 180, ac: true, total: 10 },
    { name: 'Budget Single', price: 900, occ: 1, bed: 'Single', sqft: 110, ac: false, total: 8 },
  ]},
  { name: 'Guruvayoor Grand', ownerIdx: 2, desc: 'Full-service hotel with multicuisine veg restaurant, banquet hall and rooftop view of the temple pond.', addr: 'Railway Station Road', pincode: '680102', lat: 10.5907, lng: 76.2036, star: 4, featured: true, amenities: ['wifi', 'ac', 'parking', 'breakfast', 'lift', 'family_rooms', 'veg_food', 'cctv', 'power_backup', 'laundry', 'room_service', 'wheelchair'], refund: 'FREE_CANCEL_48H', rooms: [
    { name: 'Premium AC Room', price: 4200, occ: 3, bed: 'King', sqft: 300, ac: true, total: 12 },
    { name: 'Club Suite', price: 6800, occ: 4, bed: 'King + Sofa Bed', sqft: 450, ac: true, total: 4 },
    { name: 'Deluxe Twin', price: 3100, occ: 3, bed: 'Twin', sqft: 260, ac: true, total: 10 },
  ]},
  { name: 'Nandanam Homestay', ownerIdx: 3, desc: 'Quiet homestay in a heritage Kerala home. Home-cooked sadya on request. Perfect for families.', addr: 'Puthiyakavu Junction', pincode: '680101', lat: 10.5986, lng: 76.2065, star: 0, amenities: ['wifi', 'family_rooms', 'hot_water', 'parking', 'couple_friendly', 'cctv'], refund: 'FREE_CANCEL_24H', rooms: [
    { name: 'Heritage Family Room', price: 2500, occ: 4, bed: 'Queen + 2 Floor Mattress', sqft: 320, ac: false, total: 3 },
  ]},
  { name: 'Bhavan Lodge', ownerIdx: 4, desc: 'Honest budget lodge for pilgrims — clean rooms, lockers, and 24×7 check-in for late trains.', addr: 'Bus Stand Road', pincode: '680101', lat: 10.5921, lng: 76.2054, star: 0, amenities: ['hot_water', 'cctv', 'drinking_water', 'power_backup'], refund: 'NON_REFUNDABLE', rooms: [
    { name: 'Single Non-AC', price: 700, occ: 1, bed: 'Single', sqft: 100, ac: false, total: 12 },
    { name: 'Double Non-AC', price: 1100, occ: 2, bed: 'Double', sqft: 130, ac: false, total: 10 },
  ]},
  { name: 'Kousthubham Retreat', ownerIdx: 0, desc: 'Boutique retreat with courtyard ayurvedic massage centre and temple-visiting assistance.', addr: 'Chowwara Junction', pincode: '680101', lat: 10.5909, lng: 76.2121, star: 3, amenities: ['wifi', 'ac', 'parking', 'breakfast', 'family_rooms', 'lift', 'couple_friendly', 'cctv', 'room_service', 'laundry'], refund: 'MODERATE', rooms: [
    { name: 'Courtyard AC Room', price: 2900, occ: 3, bed: 'Queen', sqft: 250, ac: true, total: 6 },
    { name: ' Retreat Suite', price: 4900, occ: 4, bed: 'King', sqft: 400, ac: true, total: 3 },
  ]},
  { name: 'Anandha Bhavan', ownerIdx: 1, desc: 'Spacious AC apartments with kitchenette — designed for families on pilgrimage week stays.', addr: 'Mammiyoor Road', pincode: '680102', lat: 10.5969, lng: 76.2032, star: 3, amenities: ['wifi', 'ac', 'parking', 'family_rooms', 'lift', 'hot_water', 'power_backup', 'laundry'], refund: 'FREE_CANCEL_48H', rooms: [
    { name: 'Two-Bedroom Apartment', price: 3900, occ: 6, bed: '2 Queens', sqft: 550, ac: true, total: 5 },
  ]},
  { name: 'Panchajanya Comforts', ownerIdx: 2, desc: 'Modern comfort hotel with fast Wi-Fi for remote workers + temple at walking distance.', addr: 'Patturaakkal', pincode: '680102', lat: 10.5882, lng: 76.2092, star: 3, amenities: ['wifi', 'ac', 'parking', 'breakfast', 'lift', 'cctv', 'room_service', 'power_backup'], refund: 'MODERATE', rooms: [
    { name: 'Business AC Room', price: 2600, occ: 2, bed: 'Queen', sqft: 230, ac: true, total: 14 },
    { name: 'Studio Suite', price: 3800, occ: 3, bed: 'King', sqft: 320, ac: true, total: 6 },
  ]},
  { name: 'Sudarshana Guest House', ownerIdx: 3, desc: 'Devotee-run guest house with dormitory-style family halls and single rooms at donation-friendly rates.', addr: 'Kizhakke Nada Lane', pincode: '680101', lat: 10.5955, lng: 76.2090, star: 0, amenities: ['hot_water', 'drinking_water', 'cctv', 'power_backup'], refund: 'STRICT', rooms: [
    { name: 'Devotee Single', price: 600, occ: 1, bed: 'Single', sqft: 90, ac: false, total: 16 },
    { name: 'Family Hall (4 beds)', price: 1400, occ: 4, bed: '4 Single', sqft: 300, ac: false, total: 6 },
  ]},
  { name: 'Marar Riverside Inn', ownerIdx: 4, desc: 'Riverside calm 2.5 km from the temple — great for couples and long-stay visitors.', addr: 'Marar Road, Riverside', pincode: '680102', lat: 10.5833, lng: 76.2168, star: 3, amenities: ['wifi', 'ac', 'parking', 'breakfast', 'couple_friendly', 'lift', 'cctv', 'laundry', 'room_service'], refund: 'FREE_CANCEL_24H', rooms: [
    { name: 'Riverside AC Room', price: 3100, occ: 3, bed: 'King', sqft: 280, ac: true, total: 9 },
    { name: 'Riverside Balcony Suite', price: 5200, occ: 4, bed: 'King + Sofa', sqft: 430, ac: true, total: 4 },
  ]},
];

async function main() {
  console.log('🌱 Seeding DEMO data for Guruvayoor Stay…');

  // Wipe (idempotent dev reseeding).
  await prisma.$transaction([
    prisma.notification.deleteMany(), prisma.auditLog.deleteMany(), prisma.deviceToken.deleteMany(),
    prisma.refreshToken.deleteMany(), prisma.review.deleteMany(), prisma.favorite.deleteMany(),
    prisma.payment.deleteMany(), prisma.bookingRoom.deleteMany(), prisma.booking.deleteMany(),
    prisma.roomAmenity.deleteMany(), prisma.roomType.deleteMany(),
    prisma.hotelAmenity.deleteMany(), prisma.hotelDocument.deleteMany(), prisma.hotelImage.deleteMany(),
    prisma.commission.deleteMany(), prisma.hotel.deleteMany(), prisma.hotelOwner.deleteMany(),
    prisma.customer.deleteMany(), prisma.platformSetting.deleteMany(), prisma.amenity.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Amenities.
  const amenityRows = await Promise.all(
    AMENITIES.map((a) => prisma.amenity.create({ data: a }))
  );
  const amenityByKey = new Map(amenityRows.map((a) => [a.key, a]));

  // Platform settings (10% default commission — configurable in admin).
  await prisma.platformSetting.create({
    data: { key: 'platform', value: {
      platformName: 'Guruvayoor Stay', commissionBps: 1000, bookingFeePaise: 0,
      taxBps: 1200, maxHotelDistanceMeters: 5000, featuredHotelIds: [],
    } },
  });

  const passwordHash = await bcrypt.hash('Customer@123', 12);
  const ownerHash = await bcrypt.hash('Owner@123', 12);

  // Admin.
  const adminEmail = (process.env.DEMO_ADMIN_EMAIL ?? 'admin@guruvayoorstay.test').toLowerCase();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? 'Admin@12345';
  await prisma.user.create({
    data: { email: adminEmail, name: process.env.DEMO_ADMIN_NAME ?? 'Platform Admin', role: 'ADMIN', passwordHash: await bcrypt.hash(adminPassword, 12), emailVerified: true },
  });

  // Owners (5, reused across hotels).
  const OWNER_NAMES = ['Ramesh Menon', 'Sunita Varma', 'Joseph Chacko', 'Lakshmi Nair', 'Abdul Rasheed'];
  const owners: Array<{ userId: string; ownerId: string }> = [];
  for (let i = 0; i < OWNER_NAMES.length; i++) {
    const u = await prisma.user.create({
      data: {
        email: `owner${i + 1}@guruvayoorstay.test`,
        name: OWNER_NAMES[i]!,
        role: 'HOTEL_OWNER',
        passwordHash: ownerHash,
        emailVerified: true,
        ownerProfile: {
          create: {
            ownerName: OWNER_NAMES[i]!,
            phone: `+9198470${String(10000 + i).slice(0, 5)}`,
            whatsapp: `+9198470${String(10000 + i).slice(0, 5)}`,
            email: `owner${i + 1}@guruvayoorstay.test`,
          },
        },
      },
      include: { ownerProfile: true },
    });
    owners.push({ userId: u.id, ownerId: u.ownerProfile!.id });
  }

  // Customers.
  const CUSTOMERS = [
    { name: 'Arjun Nambiar', email: 'arjun@example.test' },
    { name: 'Meera Pillai', email: 'meera@example.test' },
    { name: 'Rahul Desai', email: 'rahul@example.test' },
  ];
  const customers: string[] = [];
  for (const c of CUSTOMERS) {
    const u = await prisma.user.create({
      data: { email: c.email, name: c.name, role: 'CUSTOMER', passwordHash, phone: `+9199${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`, customerProfile: { create: { city: 'Kochi', state: 'Kerala' } } },
    });
    customers.push(u.id);
  }

  // Hotels + rooms + images.
  const createdHotels: Array<{ id: string; status: string; roomTypeIds: string[] }> = [];
  for (let i = 0; i < HOTELS.length; i++) {
    const h = HOTELS[i]!;
    const owner = owners[h.ownerIdx]!;
    // First 8 approved, 1 pending review, 1 pending fresh — demonstrates workflow.
    const status = i < 8 ? 'APPROVED' : i === 8 ? 'PENDING' : 'UNDER_REVIEW';
    const slug = slugify(h.name);

    const hotel = await prisma.hotel.create({
      data: {
        ownerId: owner.ownerId,
        slug,
        name: h.name,
        description: h.desc,
        status: status as never,
        addressLine1: h.addr,
        city: 'Guruvayoor',
        pincode: h.pincode,
        lat: h.lat,
        lng: h.lng,
        distanceMeters: haversineMeters(h.lat, h.lng, TEMPLE.lat, TEMPLE.lng),
        starRating: h.star,
        checkInTime: '12:00',
        checkOutTime: '11:00',
        cancellationPolicyText: 'Free cancellation as per policy. Later cancellations may retain one night charge.',
        refundPolicy: h.refund,
        hotelRules: '• Please carry a valid government ID.\n• Respect temple-town quiet hours after 22:00.\n• Non-veg and alcohol are not permitted on premises.',
        contactPhone: '+91984701234' + i,
        contactEmail: `${slug}@guruvayoorstay.test`,
        whatsapp: '+91984701234' + i,
        isFeatured: Boolean(h.featured),
        submittedAt: new Date(),
        approvedAt: status === 'APPROVED' ? new Date() : null,
        commissionBps: null,
      },
    });

    await prisma.hotelImage.create({ data: { hotelId: hotel.id, url: img(`${slug}-ext`), isCover: true, sortOrder: 0 } });
    await prisma.hotelImage.create({ data: { hotelId: hotel.id, url: img(`${slug}-lob`), sortOrder: 1 } });
    await prisma.hotelImage.create({ data: { hotelId: hotel.id, url: img(`${slug}-dine`), sortOrder: 2 } });

    await prisma.hotelAmenity.createMany({
      data: h.amenities.map((key) => ({ hotelId: hotel.id, amenityId: amenityByKey.get(key)!.id })),
    });

    await prisma.hotelDocument.createMany({
      data: [
        { hotelId: hotel.id, docType: 'registration', url: img(`${slug}-doc1`, 400, 500), docNumber: `REG-2024-${1000 + i}`, verified: status === 'APPROVED' },
        { hotelId: hotel.id, docType: 'id_proof', url: img(`${slug}-doc2`, 400, 500), verified: status === 'APPROVED' },
      ],
    });

    const roomTypeIds: string[] = [];
    for (const r of h.rooms) {
      const room = await prisma.roomType.create({
        data: {
          hotelId: hotel.id,
          name: r.name.trim(),
          slug: slugify(r.name),
          description: `${r.ac ? 'Air-conditioned' : 'Non-AC'} room with attached bath and hot water. ${r.sqft ?? 180} sq ft.`,
          basePricePaise: rupeesToPaise(r.price),
          maxOccupancy: r.occ,
          bedType: r.bed,
          roomSizeSqft: r.sqft,
          acAvailable: r.ac,
          totalRooms: r.total,
          images: [{ url: img(`${slug}-${slugify(r.name)}`), alt: r.name }],
        },
      });
      roomTypeIds.push(room.id);
      const roomAmenities = ['hot_water', 'drinking_water'].concat(r.ac ? ['ac'] : []);
      await prisma.roomAmenity.createMany({
        data: roomAmenities.map((key) => ({ roomTypeId: room.id, amenityId: amenityByKey.get(key)!.id })),
      });
    }

    const min = Math.min(...h.rooms.map((r) => rupeesToPaise(r.price)));
    await prisma.hotel.update({ where: { id: hotel.id }, data: { minPricePaise: min } });
    createdHotels.push({ id: hotel.id, status, roomTypeIds });
  }

  // Bookings: a realistic spread across statuses.
  const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'CONFIRMED', 'PENDING', 'CONFIRMED', 'COMPLETED'] as const;
  const paidStatuses = new Set(['CONFIRMED', 'COMPLETED']);
  for (let i = 0; i < statuses.length; i++) {
    const hotel = createdHotels[i % 8]!;
    const roomTypeId = hotel.roomTypeIds[0]!;
    const room = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
    if (!room) continue;
    const roomsCount = 1 + (i % 2);
    const nights = 2;
    const checkIn = d(i - 3);
    const checkOut = d(i - 3 + nights);
    const subtotal = room.basePricePaise * nights * roomsCount;
    const tax = Math.round(subtotal * 0.12);
    const commission = Math.round(subtotal * 0.10);

    const booking = await prisma.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        hotelId: hotel.id,
        customerId: customers[i % customers.length]!,
        checkIn, checkOut, nights, guests: 2 + (i % 3), roomsCount,
        subtotalPaise: subtotal, taxPaise: tax, totalPaise: subtotal + tax,
        commissionPaise: commission, ownerPayoutPaise: subtotal - commission,
        status: statuses[i],
        confirmedAt: paidStatuses.has(statuses[i]) ? new Date() : null,
        cancelledAt: statuses[i] === 'CANCELLED' ? new Date() : null,
        cancelledBy: statuses[i] === 'CANCELLED' ? 'CUSTOMER' : null,
        completedAt: statuses[i] === 'COMPLETED' ? new Date() : null,
        rooms: { create: { roomTypeId, roomsCount, pricePaise: room.basePricePaise } },
      },
    });

    if (paidStatuses.has(statuses[i])) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: 'MOCK',
          providerOrderId: `mock_order_seed_${i}`,
          providerPaymentId: `mock_pay_seed_${i}`,
          status: 'CAPTURED',
          amountPaise: subtotal + tax,
          method: 'upi',
        },
      });
    }

    if (statuses[i] === 'COMPLETED') {
      const overall = 4 + (i % 2);
      await prisma.review.create({
        data: {
          bookingId: booking.id, hotelId: hotel.id, customerId: customers[i % customers.length]!,
          overall, cleanliness: overall, location: 5, staff: overall, value: overall,
          comment: i % 2 === 0 ? 'Walkable to the temple, clean rooms and warm staff. Perfect for early darshan.' : 'Great value, quiet at night, sumptuous veg breakfast.',
        },
      });
    }
  }

  // Recompute rating aggregates.
  for (const h of createdHotels) {
    const agg = await prisma.review.aggregate({ where: { hotelId: h.id }, _avg: { overall: true }, _count: true });
    await prisma.hotel.update({ where: { id: h.id }, data: { ratingAvg: Math.round((agg._avg.overall ?? 0) * 10) / 10, reviewCount: agg._count } });
  }

  console.log(`✅ DEMO seed complete: ${createdHotels.length} hotels, ${customers.length} customers, 5 owners, 1 admin.`);
  console.log(`   Admin login: ${adminEmail} / (from DEMO_ADMIN_PASSWORD)`);
}

main().finally(() => prisma.$disconnect());
