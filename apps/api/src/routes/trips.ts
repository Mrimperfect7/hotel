import { Router } from 'express';
import { prisma } from '@gsv/database';
import { asyncH } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const tripsRouter = Router();

// GET /api/trips/me - Get unified trip timeline
tripsRouter.get('/me', requireAuth, asyncH(async (req, res) => {
  // Find customer's trip (or create one)
  let trip = await prisma.trip.findFirst({
    where: { customerId: req.auth!.id },
    include: { items: { orderBy: { dateTime: 'asc' } } }
  });

  if (!trip) {
    trip = await prisma.trip.create({
      data: { customerId: req.auth!.id, name: "My Guruvayoor Trip" },
      include: { items: true }
    });
  }

  // Also include hotel bookings directly if they aren't synced (legacy compatibility)
  const legacyBookings = await prisma.booking.findMany({
    where: { customerId: req.auth!.id, status: { in: ['CONFIRMED', 'PENDING'] } },
    include: { hotel: true }
  });
  
  const tripData = {
    ...trip,
    items: [
      ...trip.items,
      ...legacyBookings.map(b => ({
        id: `legacy-${b.id}`,
        tripId: trip!.id,
        type: 'HOTEL',
        entityId: b.id,
        dateTime: b.checkIn,
        title: 'Hotel Booking',
        subtitle: b.hotel.name,
        createdAt: b.createdAt
      }))
    ].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  };

  res.json({ data: tripData });
}));
