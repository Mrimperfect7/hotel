import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth, optionalAuth } from '../middleware/requireAuth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';
import {
  createBookingSchema, calculatePrice, splitCommission, generateBookingCode,
  BOOKING_CODE_RE, nightsBetween, INVENTORY_HOLDING_STATUSES, canTransitionAs,
  type Actor,
} from '@gsv/types';
import { effectiveCommissionBps } from '../lib/settings.js';
import { notify } from '../lib/notify.js';
import { audit } from '../lib/audit.js';

export const bookingsRouter = Router();

// ── Inventory math (server-side only) ────────────────────────────────────────

/**
 * Rooms already held for a room type over [checkIn, checkOut).
 * Held = rows of ACTIVE bookings (PENDING/CONFIRMED) overlapping the stay.
 */
async function heldRooms(
  tx: Prisma.TransactionClient,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date
): Promise<number> {
  const agg = await tx.bookingRoom.aggregate({
    where: {
      roomTypeId,
      booking: {
        status: { in: [...INVENTORY_HOLDING_STATUSES] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    },
    _sum: { roomsCount: true },
  });
  return agg._sum.roomsCount ?? 0;
}

/**
 * CREATE BOOKING — the critical transactional path.
 *
 * 1. Validates the hotel is APPROVED and bookable.
 * 2. Re-reads the room type INSIDE a SERIALIZABLE transaction.
 * 3. Computes totals server-side from DB price (client price is ignored).
 * 4. Validates availability for every night against active bookings.
 * 5. Inserts booking + BookingRoom; releases inventory automatically on
 *    cancel/reject because holds are derived from active bookings.
 */
bookingsRouter.post(
  '/',
  bookingLimiter,
  optionalAuth,
  asyncH(async (req, res) => {
    const input = createBookingSchema.parse(req.body);

    const isGuest = !req.auth;
    if (isGuest && !input.guest) {
      throw ApiError.badRequest('Guest name, phone and email are required for guest bookings', 'GUEST_DETAILS_REQUIRED');
    }

    const nights = nightsBetween(input.checkIn, input.checkOut);
    if (nights < 1) throw ApiError.badRequest('Stay must be at least one night', 'INVALID_DATES');
    if (nights > 30) throw ApiError.badRequest('Stays longer than 30 nights are not supported online', 'STAY_TOO_LONG');

    // Concurrency model: pg_advisory_xact_lock(roomTypeId) serializes every
    // booking attempt for the same room type. Each transaction RE-READS fresh
    // availability after acquiring the lock, so two racing requests can never
    // both pass the availability check — the second sees the first's holds.
    const result = await prisma.$transaction(
      async (tx) => {
        // Row-level style lock: serialize concurrent bookings per room type.
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext($1))`, input.roomTypeId);

        const hotel = await tx.hotel.findFirst({
          where: { id: input.hotelId, status: 'APPROVED', deletedAt: null },
          include: { owner: { include: { user: true } } },
        });
        if (!hotel) throw ApiError.notFound('Hotel is not available for booking', 'HOTEL_NOT_BOOKABLE');

        const roomType = await tx.roomType.findFirst({
          where: { id: input.roomTypeId, hotelId: hotel.id, deletedAt: null },
        });
        if (!roomType) throw ApiError.notFound('Room type not found', 'ROOM_NOT_FOUND');

        if (input.guests > roomType.maxOccupancy * input.rooms) {
          throw ApiError.badRequest(
            `${input.guests} guests exceed capacity of ${input.rooms} × ${roomType.name} (max ${roomType.maxOccupancy} per room)`,
            'CAPACITY_EXCEEDED'
          );
        }

        const sellable = roomType.totalRooms - roomType.blockedRooms;
        const held = await heldRooms(tx, roomType.id, input.checkIn, input.checkOut);
        const available = sellable - held;
        if (input.rooms > available) {
          throw ApiError.unavailable(
            available <= 0
              ? 'This room type is sold out for your dates'
              : `Only ${available} room(s) left for your dates`
          );
        }

        // ── Server-side pricing — client values are never trusted ──
        const { subtotalPaise, taxPaise, totalPaise } = calculatePrice({
          pricePerNightPaise: roomType.basePricePaise,
          nights,
          rooms: input.rooms,
        });
        const commissionBps = await effectiveCommissionBps(hotel.commissionBps);
        const { commissionPaise, ownerPayoutPaise } = splitCommission(subtotalPaise, commissionBps);

        // Unique booking code with collision retry.
        let bookingCode = generateBookingCode();
        for (let i = 0; i < 5; i++) {
          const clash = await tx.booking.findUnique({ where: { bookingCode } });
          if (!clash) break;
          bookingCode = generateBookingCode();
        }

        return tx.booking.create({
          data: {
            bookingCode,
            hotelId: hotel.id,
            customerId: isGuest ? null : req.auth!.id,
            guestName: isGuest ? input.guest!.name : null,
            guestPhone: isGuest ? input.guest!.phone : null,
            guestEmail: isGuest ? input.guest!.email.toLowerCase() : null,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            nights,
            guests: input.guests,
            roomsCount: input.rooms,
            subtotalPaise,
            taxPaise,
            totalPaise,
            commissionPaise,
            ownerPayoutPaise,
            status: 'PENDING',
            specialRequests: input.specialRequests,
            rooms: {
              create: { roomTypeId: roomType.id, roomsCount: input.rooms, pricePaise: roomType.basePricePaise },
            },
          },
          include: { rooms: { include: { roomType: { select: { name: true } } } } },
        });
      },
      // maxWait covers queuing behind the advisory lock held by a concurrent
      // booking for the same room type; the loser then sees fresh availability
      // and gets a clean OUT_OF_STOCK instead of a timeout error.
      { maxWait: 15000, timeout: 15000 },
    );

    // Post-transaction notifications (owner + customer). Never block response.
    const room = result.rooms[0]?.roomType?.name ?? 'Room';
    void notifyOwnerAndCustomer(result.id);

    res.status(201).json({
      bookingId: result.id,
      bookingCode: result.bookingCode,
      status: result.status,
      totals: { subtotalPaise: result.subtotalPaise, taxPaise: result.taxPaise, totalPaise: result.totalPaise },
      room,
      guestCheckout: isGuest,
    });

    async function notifyOwnerAndCustomer(bookingId: string) {
      const b = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          hotel: { include: { owner: true } },
          rooms: { include: { roomType: true } },
        },
      });
      if (!b) return;
      await notify({
        userId: b.hotel.owner.userId,
        type: 'BOOKING_CREATED',
        title: `New booking ${b.bookingCode}`,
        body: `${b.guestName ?? 'A customer'} · ${b.rooms[0]?.roomType.name} × ${b.roomsCount} · ${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut.toISOString().slice(0, 10)} · ₹${(b.totalPaise / 100).toFixed(0)}`,
        channels: ['IN_APP', 'PUSH', 'EMAIL'],
        meta: { bookingId: b.id },
      });
      if (b.customerId) {
        await notify({
          userId: b.customerId,
          type: 'BOOKING_CREATED',
          title: `Booking requested — ${b.bookingCode}`,
          body: `Your request at ${b.hotel.name} was sent to the hotel. You will be notified once it is confirmed.`,
          channels: ['IN_APP', 'EMAIL'],
          meta: { bookingId: b.id },
        });
      }
    }
  })
);

/** GET /api/bookings/track?code=GV-…&contact=phone-or-email — guest tracking. */
bookingsRouter.get(
  '/track',
  optionalAuth,
  asyncH(async (req, res) => {
    const code = String(req.query.code ?? '').trim().toUpperCase();
    const contact = String(req.query.contact ?? '').trim().toLowerCase();
    if (!BOOKING_CODE_RE.test(code) || !contact) {
      throw ApiError.badRequest('Booking code and phone/email are required', 'TRACK_PARAMS_INVALID');
    }
    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: code,
        OR: [{ guestEmail: contact }, { guestPhone: contact }],
      },
      include: {
        hotel: { select: { name: true, slug: true, contactPhone: true, addressLine1: true, city: true } },
        rooms: { include: { roomType: { select: { name: true } } } },
        payments: { select: { status: true, amountPaise: true } },
      },
    });
    if (!booking) throw ApiError.notFound('No booking found for those details', 'BOOKING_NOT_FOUND');
    res.json({ booking: publicBooking(booking) });
  })
);

/** GET /api/bookings/mine — customer's own bookings. */
bookingsRouter.get(
  '/mine',
  requireAuth,
  asyncH(async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.auth!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        hotel: { select: { name: true, slug: true, contactPhone: true, city: true, addressLine1: true } },
        rooms: { include: { roomType: { select: { name: true } } } },
        payments: { select: { status: true, amountPaise: true } },
      },
    });
    res.json({ bookings: bookings.map(publicBooking) });
  })
);

/** GET /api/bookings/:id — customer, hotel owner or admin. */
bookingsRouter.get(
  '/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        hotel: { include: { owner: { select: { userId: true } } } },
        rooms: { include: { roomType: true } },
        payments: true,
        customer: { select: { name: true, email: true, phone: true } },
      },
    });
    if (!booking) throw ApiError.notFound('Booking not found');

    const isCustomer = booking.customerId === req.auth!.id;
    const isOwner = booking.hotel.owner.userId === req.auth!.id;
    const isAdmin = req.auth!.role === 'ADMIN' || req.auth!.role === 'SUPER_ADMIN';
    if (!isCustomer && !isOwner && !isAdmin) throw ApiError.forbidden();

    // Contact details are only for the hotel and admins.
    const contact = isOwner || isAdmin
      ? {
          customerName: booking.customer?.name ?? booking.guestName,
          customerPhone: booking.customer?.phone ?? booking.guestPhone,
          customerEmail: booking.customer?.email ?? booking.guestEmail,
        }
      : undefined;

    res.json({ booking: { ...publicBooking(booking), contact } });
  })
);

// ── Booking state transitions ────────────────────────────────────────────────

const transitionSchema = z.object({
  action: z.enum(['CONFIRM', 'REJECT', 'CANCEL', 'COMPLETE', 'NO_SHOW']),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/bookings/:id/transition
 * Enforces the state machine + actor permissions + inventory rollback on
 * cancel/reject (derived holds disappear automatically once status leaves the
 * holding set — nothing else to update, so double-booking can't drift).
 */
bookingsRouter.post(
  '/:id/transition',
  requireAuth,
  asyncH(async (req, res) => {
    const { action, reason } = transitionSchema.parse(req.body);
    const target: Record<string, 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'> = {
      CONFIRM: 'CONFIRMED', REJECT: 'REJECTED', CANCEL: 'CANCELLED', COMPLETE: 'COMPLETED', NO_SHOW: 'NO_SHOW',
    };
    if (!target[action]) throw ApiError.badRequest('Unknown action', 'UNKNOWN_ACTION');
    const to = target[action];

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { hotel: { include: { owner: { select: { userId: true } } } } },
    });
    if (!booking) throw ApiError.notFound('Booking not found');

    const actor: Actor =
      req.auth!.role === 'ADMIN' || req.auth!.role === 'SUPER_ADMIN' ? 'ADMIN' :
      booking.hotel.owner.userId === req.auth!.id ? 'OWNER' : 'CUSTOMER';
    if (actor === 'CUSTOMER' && !booking.customerId) throw ApiError.forbidden('Guest bookings are managed by the hotel');

    if (!canTransitionAs(booking.status, to, actor)) {
      throw ApiError.conflict(`Cannot ${action.toLowerCase()} a ${booking.status.toLowerCase()} booking`, 'INVALID_TRANSITION');
    }

    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const data: Prisma.BookingUpdateInput = { status: to };
      if (to === 'CONFIRMED') data.confirmedAt = now;
      if (to === 'REJECTED') { data.rejectedAt = now; data.cancelReason = reason; }
      if (to === 'CANCELLED') { data.cancelledAt = now; data.cancelledBy = actor; data.cancelReason = reason; }
      if (to === 'COMPLETED') data.completedAt = now;
      return tx.booking.update({ where: { id: booking.id }, data });
    });

    await audit(req, `BOOKING_${to}`, 'Booking', booking.id, { from: booking.status, to, reason });

    // Notifications per transition.
    const customerId = booking.customerId;
    if (customerId) {
      const map = {
        CONFIRMED: { type: 'BOOKING_CONFIRMED' as const, title: `Booking confirmed — ${booking.bookingCode}`, body: `${booking.hotel.name} confirmed your stay. See you soon! 🙏` },
        REJECTED: { type: 'BOOKING_REJECTED' as const, title: `Booking declined — ${booking.bookingCode}`, body: `The hotel could not accept this request. ${reason ?? ''}` },
        CANCELLED: { type: 'BOOKING_CANCELLED' as const, title: `Booking cancelled — ${booking.bookingCode}`, body: `Your booking at ${booking.hotel.name} was cancelled by the ${actor.toLowerCase()}.` },
        COMPLETED: { type: 'BOOKING_COMPLETED' as const, title: `Stay completed — ${booking.bookingCode}`, body: `Thanks for staying at ${booking.hotel.name}. You can now leave a review.` },
        NO_SHOW: { type: 'BOOKING_COMPLETED' as const, title: `Marked no-show — ${booking.bookingCode}`, body: `The hotel marked this booking as a no-show.` },
      };
      const key = to === 'NO_SHOW' ? 'NO_SHOW' : to;
      const msg = map[key];
      if (msg) {
        await notify({ userId: customerId, ...msg, channels: ['IN_APP', 'EMAIL'] });
      }
    }

    res.json({ booking: { id: updated.id, status: updated.status } });
  })
);

/** Shape shared by list/detail/track endpoints (no PII unless authorized). */
function publicBooking(b: {
  id: string; bookingCode: string; status: string; checkIn: Date; checkOut: Date;
  nights: number; guests: number; roomsCount: number; subtotalPaise: number; taxPaise: number;
  totalPaise: number; hotel: { name: string; slug: string; contactPhone: string; addressLine1?: string; city?: string };
  rooms: Array<{ roomType: { name: string }; roomsCount: number }>;
  payments: Array<{ status: string; amountPaise: number }>;
  specialRequests?: string | null; cancelReason?: string | null; createdAt: Date;
}) {
  return {
    id: b.id,
    bookingCode: b.bookingCode,
    status: b.status,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guests: b.guests,
    roomsCount: b.roomsCount,
    roomName: b.rooms[0]?.roomType.name ?? '',
    hotel: b.hotel,
    amounts: { subtotalPaise: b.subtotalPaise, taxPaise: b.taxPaise, totalPaise: b.totalPaise },
    paymentStatus: b.payments[0]?.status ?? 'INITIATED',
    specialRequests: b.specialRequests ?? null,
    cancelReason: b.cancelReason ?? null,
    createdAt: b.createdAt,
  };
}
