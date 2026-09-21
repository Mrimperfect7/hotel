import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const guidesRouter = Router();

// GET /api/guides - List approved guides
guidesRouter.get('/', asyncH(async (req, res) => {
  const guides = await prisma.guide.findMany({
    where: { status: 'APPROVED', deletedAt: null },
    include: { user: { select: { name: true, avatarUrl: true } } }
  });
  res.json({ data: guides });
}));

// GET /api/guides/:id - Get specific guide
guidesRouter.get('/:id', asyncH(async (req, res) => {
  const guide = await prisma.guide.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { name: true, avatarUrl: true } }, availabilities: true }
  });
  if (!guide || guide.status !== 'APPROVED') throw new ApiError('Guide not found', 404);
  res.json({ data: guide });
}));

// POST /api/guides/register - Register as a guide
guidesRouter.post('/register', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    phone: z.string(),
    languages: z.array(z.string()),
    experienceYears: z.number().int().min(0),
    description: z.string().optional(),
    hourlyPricePaise: z.number().int().min(0),
    halfDayPricePaise: z.number().int().min(0),
    fullDayPricePaise: z.number().int().min(0),
  });
  const data = schema.parse(req.body);

  if (req.user!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.user!.id }, data: { role: 'GUIDE' } });
  }

  const guide = await prisma.guide.create({
    data: {
      userId: req.user!.id,
      name: req.user!.name,
      ...data,
      status: 'PENDING'
    }
  });

  res.json({ data: guide });
}));

// POST /api/guides/:id/book - Book a guide
guidesRouter.post('/:id/book', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    date: z.string(),
    startTime: z.string().optional(),
    durationHours: z.number().int().optional(),
    totalPaise: z.number().int(),
    specialRequests: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const booking = await prisma.guideBooking.create({
    data: {
      guideId: req.params.id,
      customerId: req.user!.id,
      date: new Date(data.date),
      startTime: data.startTime,
      durationHours: data.durationHours,
      totalPaise: data.totalPaise,
      specialRequests: data.specialRequests,
      status: 'PENDING'
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.user!.id } })
    || await prisma.trip.create({ data: { customerId: req.user!.id, name: "My Guruvayoor Trip" } });

  await prisma.tripItem.create({
    data: {
      tripId: trip.id,
      type: 'GUIDE',
      entityId: booking.id,
      dateTime: new Date(data.date),
      title: 'Guide Booking',
      subtitle: 'Local Guide'
    }
  });

  res.json({ data: booking });
}));
