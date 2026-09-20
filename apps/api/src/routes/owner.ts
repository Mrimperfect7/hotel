import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/requireAuth.js';
import { notify } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
import { rupeesToPaise } from '@gsv/types';

export const ownerRouter = Router();

/** Every route requires an authenticated HOTEL_OWNER (admins also allowed). */
ownerRouter.use(requireAuth, requireRole('HOTEL_OWNER', 'ADMIN', 'SUPER_ADMIN'));

/** Resolve the owner's hotel(s); ensures the caller owns the hotel. */
async function myHotels(userId: string) {
  return prisma.hotel.findMany({
    where: { owner: { userId }, deletedAt: null },
    include: { roomTypes: { where: { deletedAt: null } } },
  });
}

async function assertOwnsHotel(userId: string, hotelId: string) {
  const hotel = await prisma.hotel.findFirst({ where: { id: hotelId, owner: { userId }, deletedAt: null } });
  if (!hotel) throw ApiError.forbidden('You do not manage this hotel');
  return hotel;
}

/** GET /api/owner/hotels */
ownerRouter.get(
  '/hotels',
  asyncH(async (req, res) => {
    res.json({ hotels: await myHotels(req.auth!.id) });
  })
);

/** GET /api/owner/dashboard — today's bookings, check-ins/outs, revenue, occupancy, pending. */
ownerRouter.get(
  '/dashboard',
  asyncH(async (req, res) => {
    const hotels = await myHotels(req.auth!.id);
    const hotelIds = hotels.map((h) => h.id);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);

    const [todayBookings, upcoming, checkInsToday, checkOutsToday, pending, cancelled, revenueAgg, roomsAgg] = await Promise.all([
      prisma.booking.count({ where: { hotelId: { in: hotelIds }, createdAt: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.booking.count({ where: { hotelId: { in: hotelIds }, status: 'CONFIRMED', checkIn: { gte: tomorrowStart } } }),
      prisma.booking.findMany({
        where: { hotelId: { in: hotelIds }, status: 'CONFIRMED', checkIn: { gte: todayStart, lt: tomorrowStart } },
        include: { rooms: { include: { roomType: { select: { name: true } } } } },
      }),
      prisma.booking.count({ where: { hotelId: { in: hotelIds }, status: 'CONFIRMED', checkOut: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.booking.count({ where: { hotelId: { in: hotelIds }, status: 'PENDING' } }),
      prisma.booking.count({ where: { hotelId: { in: hotelIds }, status: 'CANCELLED' } }),
      prisma.booking.aggregate({
        where: { hotelId: { in: hotelIds }, status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { ownerPayoutPaise: true },
      }),
      prisma.roomType.aggregate({
        where: { hotelId: { in: hotelIds }, deletedAt: null },
        _sum: { totalRooms: true },
      }),
    ]);

    res.json({
      todayBookings, upcoming,
      checkInsToday: checkInsToday.map((b) => ({
        id: b.id, bookingCode: b.bookingCode, guest: b.guestName ?? 'Registered guest',
        roomsCount: b.roomsCount, roomName: b.rooms[0]?.roomType.name ?? '',
      })),
      checkOutsToday: checkOutsToday,
      pending, cancelled,
      revenuePaise: revenueAgg._sum.ownerPayoutPaise ?? 0,
      totalRooms: roomsAgg._sum.totalRooms ?? 0,
    });
  })
);

/** GET /api/owner/bookings — filterable booking table. */
ownerRouter.get(
  '/bookings',
  asyncH(async (req, res) => {
    const q = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
      hotelId: z.string().uuid().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(req.query);

    const hotels = await myHotels(req.auth!.id);
    const hotelIds = hotels.map((h) => h.id);
    if (q.hotelId && !hotelIds.includes(q.hotelId)) throw ApiError.forbidden();

    const where = {
      hotelId: { in: q.hotelId ? [q.hotelId] : hotelIds },
      ...(q.status ? { status: q.status } : {}),
    };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        rooms: { include: { roomType: { select: { name: true } } } },
        customer: { select: { name: true, phone: true, email: true } },
      },
    });

    res.json({
      bookings: bookings.map((b) => ({
        id: b.id, bookingCode: b.bookingCode, status: b.status,
        hotelId: b.hotelId,
        customer: {
          name: b.customer?.name ?? b.guestName ?? 'Guest',
          phone: b.customer?.phone ?? b.guestPhone,
          email: b.customer?.email ?? b.guestEmail,
          whatsapp: b.customer?.phone ?? b.guestPhone,
        },
        roomName: b.rooms[0]?.roomType.name ?? '',
        checkIn: b.checkIn, checkOut: b.checkOut, nights: b.nights,
        guests: b.guests, roomsCount: b.roomsCount,
        amounts: { subtotalPaise: b.subtotalPaise, taxPaise: b.taxPaise, totalPaise: b.totalPaise },
        ownerPayoutPaise: b.ownerPayoutPaise,
        paymentStatus: 'UNPAID',
        specialRequests: b.specialRequests,
        createdAt: b.createdAt,
      })),
    });
  })
);

/**
 * PATCH /api/owner/bookings/:id — CONFIRM / REJECT / CANCEL booking + room
 * inventory updates. State-machine safe via shared types helper.
 */
ownerRouter.patch(
  '/bookings/:id',
  asyncH(async (req, res) => {
    const { action, reason } = z.object({
      action: z.enum(['CONFIRM', 'REJECT', 'CANCEL']),
      reason: z.string().max(500).optional(),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { hotel: true },
    });
    if (!booking) throw ApiError.notFound('Booking not found');
    await assertOwnsHotel(req.auth!.id, booking.hotelId);

    const transitions: Record<string, 'CONFIRMED' | 'REJECTED' | 'CANCELLED'> = {
      CONFIRM: 'CONFIRMED', REJECT: 'REJECTED', CANCEL: 'CANCELLED',
    };
    const to = transitions[action];
    if (!to) throw ApiError.badRequest('Unknown action', 'UNKNOWN_ACTION');

    const legal: Record<string, string[]> = {
      'PENDING->CONFIRMED': ['CONFIRMED'],
      'PENDING->REJECTED': ['REJECTED'],
      'PENDING->CANCELLED': ['CANCELLED'],
      'CONFIRMED->CANCELLED': ['CANCELLED'],
    };
    if (!legal[`${booking.status}->${to}`]) {
      throw ApiError.conflict(`Cannot ${action.toLowerCase()} a ${booking.status.toLowerCase()} booking`, 'INVALID_TRANSITION');
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: to,
        ...(to === 'CONFIRMED' ? { confirmedAt: now } : {}),
        ...(to === 'REJECTED' ? { rejectedAt: now, cancelReason: reason } : {}),
        ...(to === 'CANCELLED' ? { cancelledAt: now, cancelledBy: 'OWNER', cancelReason: reason } : {}),
      },
    });

    if (booking.customerId) {
      const titles: Record<string, string> = {
        CONFIRMED: `Booking confirmed — ${booking.bookingCode}`,
        REJECTED: `Booking declined — ${booking.bookingCode}`,
        CANCELLED: `Booking cancelled — ${booking.bookingCode}`,
      };
      const bodies: Record<string, string> = {
        CONFIRMED: `${booking.hotel.name} confirmed your stay. Show booking ${booking.bookingCode} at check-in.`,
        REJECTED: `The hotel could not accept this request.${reason ? ' Reason: ' + reason : ''}`,
        CANCELLED: `Your booking was cancelled by the hotel.${reason ? ' Reason: ' + reason : ''}`,
      };
      const title: string = titles[to] ?? 'Booking update';
      const body: string = bodies[to] ?? `Your booking ${booking.bookingCode} is now ${to.toLowerCase()}.`;
      await notify({
        userId: booking.customerId,
        type: to === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : to === 'REJECTED' ? 'BOOKING_REJECTED' : 'BOOKING_CANCELLED',
        title,
        body,
        channels: ['IN_APP', 'PUSH', 'SMS'],
      });
    }

    res.json({ booking: { id: updated.id, status: updated.status } });
  })
);

// ── Rooms & inventory ────────────────────────────────────────────────────────

const roomUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(2000).optional(),
  basePrice: z.number().min(199).max(100000).optional(),
  maxOccupancy: z.number().int().min(1).max(10).optional(),
  bedType: z.string().min(2).max(40).optional(),
  totalRooms: z.number().int().min(0).max(200).optional(),
  blockedRooms: z.number().int().min(0).max(200).optional(),
  acAvailable: z.boolean().optional(),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).optional(),
});

/** PATCH /api/owner/rooms/:id — update room details, price, inventory. */
ownerRouter.patch(
  '/rooms/:id',
  asyncH(async (req, res) => {
    const data = roomUpdateSchema.parse(req.body);
    const room = await prisma.roomType.findUnique({ where: { id: req.params.id }, include: { hotel: true } });
    if (!room || room.deletedAt) throw ApiError.notFound('Room not found');
    await assertOwnsHotel(req.auth!.id, room.hotelId);
    if (data.blockedRooms != null && data.totalRooms == null && data.blockedRooms > room.totalRooms) {
      throw ApiError.badRequest('Blocked rooms cannot exceed total rooms', 'BLOCKED_EXCEEDS_TOTAL');
    }

    const updated = await prisma.roomType.update({
      where: { id: room.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.basePrice != null ? { basePricePaise: rupeesToPaise(data.basePrice) } : {}),
        ...(data.maxOccupancy != null ? { maxOccupancy: data.maxOccupancy } : {}),
        ...(data.bedType ? { bedType: data.bedType } : {}),
        ...(data.totalRooms != null ? { totalRooms: data.totalRooms } : {}),
        ...(data.blockedRooms != null ? { blockedRooms: data.blockedRooms } : {}),
        ...(data.acAvailable != null ? { acAvailable: data.acAvailable } : {}),
        ...(data.images ? { images: data.images } : {}),
      },
    });
    await audit(req, 'ROOM_UPDATED', 'RoomType', room.id, data);

    // Keep the hotel's denormalized min price fresh.
    const rooms = await prisma.roomType.findMany({ where: { hotelId: room.hotelId, deletedAt: null } });
    if (rooms.length) {
      await prisma.hotel.update({ where: { id: room.hotelId }, data: { minPricePaise: Math.min(...rooms.map((r) => r.basePricePaise)) } });
    }
    res.json({ room: updated });
  })
);

/** POST /api/owner/hotels/:hotelId/rooms — add a room category. */
ownerRouter.post(
  '/hotels/:hotelId/rooms',
  asyncH(async (req, res) => {
    const hotelId = z.string().uuid().parse(req.params.hotelId);
    await assertOwnsHotel(req.auth!.id, hotelId);
    const data = roomUpdateSchema.parse(req.body);
    if (!data.name || data.basePrice == null) {
      throw ApiError.badRequest('Room name and base price are required', 'ROOM_FIELDS_REQUIRED');
    }
    const room = await prisma.roomType.create({
      data: {
        hotelId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.description,
        basePricePaise: rupeesToPaise(data.basePrice),
        maxOccupancy: data.maxOccupancy ?? 2,
        bedType: data.bedType ?? 'Queen',
        acAvailable: data.acAvailable ?? false,
        totalRooms: data.totalRooms ?? 1,
        images: data.images ?? [],
      },
    });
    res.status(201).json({ room });
  })
);

/** GET /api/owner/availability?hotelId=&month=YYYY-MM — occupancy calendar. */
ownerRouter.get(
  '/availability',
  asyncH(async (req, res) => {
    const q = z.object({
      hotelId: z.string().uuid(),
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }).parse(req.query);
    await assertOwnsHotel(req.auth!.id, q.hotelId);

    const monthStr = q.month ?? new Date().toISOString().slice(0, 7);
    const start = new Date(`${monthStr}-01T00:00:00.000Z`);
    const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);

    const rooms = await prisma.roomType.findMany({ where: { hotelId: q.hotelId, deletedAt: null } });
    const holds = await prisma.bookingRoom.findMany({
      where: {
        roomTypeId: { in: rooms.map((r) => r.id) },
        booking: { status: { in: ['PENDING', 'CONFIRMED'] }, checkIn: { lt: end }, checkOut: { gt: start } },
      },
      select: { roomTypeId: true, roomsCount: true, booking: { select: { checkIn: true, checkOut: true } } },
    });

    const days: string[] = [];
    for (const d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10));

    const calendar = days.map((day) => ({
      date: day,
      rooms: rooms.map((r) => {
        const booked = holds
          .filter((h) => h.roomTypeId === r.id && h.booking.checkIn <= new Date(day) && h.booking.checkOut > new Date(day))
          .reduce((s, h) => s + h.roomsCount, 0);
        return { roomTypeId: r.id, name: r.name, sellable: r.totalRooms - r.blockedRooms, booked, available: Math.max(0, r.totalRooms - r.blockedRooms - booked) };
      }),
    }));

    res.json({ month: monthStr, days: calendar });
  })
);

/** PATCH /api/owner/hotels/:id/profile — hotel profile edits (re-review not needed for cosmetic fields). */
ownerRouter.patch(
  '/hotels/:id/profile',
  asyncH(async (req, res) => {
    const hotel = await assertOwnsHotel(req.auth!.id, z.string().uuid().parse(req.params.id));
    const data = z.object({
      description: z.string().max(4000).optional(),
      hotelRules: z.string().max(3000).optional(),
      cancellationPolicyText: z.string().max(3000).optional(),
      contactPhone: z.string().min(10).max(15).optional(),
      whatsapp: z.string().max(15).optional(),
      checkInTime: z.string().optional(),
      checkOutTime: z.string().optional(),
    }).parse(req.body);
    const updated = await prisma.hotel.update({ where: { id: hotel.id }, data });
    await audit(req, 'HOTEL_PROFILE_UPDATED', 'Hotel', hotel.id, data);
    res.json({ hotel: updated });
  })
);

/** GET /api/owner/reviews — reviews across my hotels + respond. */
ownerRouter.get(
  '/reviews',
  asyncH(async (req, res) => {
    const hotels = await myHotels(req.auth!.id);
    const reviews = await prisma.review.findMany({
      where: { hotelId: { in: hotels.map((h) => h.id) } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { customer: { select: { name: true } }, hotel: { select: { name: true } } },
    });
    res.json({ reviews });
  })
);

ownerRouter.post(
  '/reviews/:id/response',
  asyncH(async (req, res) => {
    const { response } = z.object({ response: z.string().min(2).max(1500) }).parse(req.body);
    const hotels = await myHotels(req.auth!.id);
    const review = await prisma.review.findUnique({ where: { id: z.string().uuid().parse(req.params.id) }, include: { hotel: true } });
    if (!review || !hotels.some((h) => h.id === review.hotelId)) throw ApiError.forbidden();
    const updated = await prisma.review.update({ where: { id: review.id }, data: { response, respondedAt: new Date() } });
    await notify({
      userId: review.customerId,
      type: 'REVIEW_RESPONSE',
      title: 'The hotel responded to your review',
      body: response.slice(0, 140),
      channels: ['IN_APP'],
    });
    res.json({ review: updated });
  })
);
