import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cacheMiddleware, clearCachePattern } from '../lib/redis.js';

export const guidesRouter = Router();

// GET /api/guides - List approved guides (Redis cached)
guidesRouter.get(
  '/',
  cacheMiddleware({ ttlSeconds: 60, prefix: 'cache:guides:list' }),
  asyncH(async (req, res) => {
    const guides = await prisma.guide.findMany({
      where: { status: 'APPROVED', deletedAt: null },
      include: { user: { select: { name: true, avatarUrl: true } } }
    });
    res.json({ data: guides });
  })
);

// GET /api/guides/:id - Get specific guide (Redis cached)
guidesRouter.get(
  '/:id',
  cacheMiddleware({ ttlSeconds: 60, prefix: 'cache:guides:item', keyGenerator: (req) => req.params.id }),
  asyncH(async (req, res) => {
    const guide = await prisma.guide.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { name: true, avatarUrl: true } }, availabilities: true }
    });
    if (!guide || guide.status !== 'APPROVED') throw ApiError.notFound('Guide not found');
    res.json({ data: guide });
  })
);

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

  if (req.auth!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.auth!.id }, data: { role: 'GUIDE' } });
  }

  const guide = await prisma.guide.create({
    data: {
      userId: req.auth!.id,
      name: req.auth!.name,
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
      guideId: req.params.id as string,
      customerId: req.auth!.id,
      date: new Date(data.date),
      startTime: data.startTime,
      durationHours: data.durationHours,
      totalPaise: data.totalPaise,
      specialRequests: data.specialRequests,
      status: 'PENDING'
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.auth!.id } })
    || await prisma.trip.create({ data: { customerId: req.auth!.id, name: "My Guruvayoor Trip", tripCode: `NMG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}` } });

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

// GET /api/guides/dashboard - Guide owner dashboard
guidesRouter.get('/dashboard', requireAuth, asyncH(async (req, res) => {
  const guide = await prisma.guide.findUnique({
    where: { userId: req.auth!.id }
  });
  if (!guide) throw ApiError.forbidden('Not registered as guide');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.guideBooking.findMany({
    where: { guideId: guide.id },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { date: 'asc' }
  });

  const pending = bookings.filter(b => b.status === 'PENDING').length;
  const upcoming = bookings.filter(b => b.status === 'CONFIRMED' && b.date >= today).length;
  const revenuePaise = bookings.filter(b => b.status === 'COMPLETED').reduce((acc, b) => acc + b.totalPaise, 0);

  res.json({
    guide,
    stats: { pending, upcoming, revenuePaise },
    recentBookings: bookings.slice(0, 10)
  });
}));

// GET /api/guides/bookings - List all bookings for guide
guidesRouter.get('/bookings', requireAuth, asyncH(async (req, res) => {
  const guide = await prisma.guide.findUnique({ where: { userId: req.auth!.id } });
  if (!guide) throw ApiError.forbidden('Not a guide');

  const bookings = await prisma.guideBooking.findMany({
    where: { guideId: guide.id },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { date: 'desc' }
  });
  res.json({ bookings, data: bookings });
}));

// GET /api/guides/bookings/:id - Get specific guide booking
guidesRouter.get('/bookings/:id', requireAuth, asyncH(async (req, res) => {
  const booking = await prisma.guideBooking.findUnique({
    where: { id: req.params.id },
    include: {
      guide: true,
      customer: { select: { name: true, phone: true } }
    }
  });
  if (!booking) throw ApiError.notFound('Booking not found');
  res.json({ data: booking, booking });
}));

// GET /api/guides/profile - Get guide profile
guidesRouter.get('/profile', requireAuth, asyncH(async (req, res) => {
  const guide = await prisma.guide.findUnique({ where: { userId: req.auth!.id } });
  if (!guide) throw ApiError.forbidden('Not a guide');
  res.json({ guide });
}));

// PATCH /api/guides/profile - Update guide profile
guidesRouter.patch('/profile', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    phone: z.string().optional(),
    languages: z.array(z.string()).optional(),
    experienceYears: z.number().int().min(0).optional(),
    specialization: z.string().optional(),
    description: z.string().optional(),
    serviceArea: z.string().optional(),
    hourlyPricePaise: z.number().int().min(0).optional(),
    halfDayPricePaise: z.number().int().min(0).optional(),
    fullDayPricePaise: z.number().int().min(0).optional(),
    upiId: z.string().optional(),
  });
  const data = schema.parse(req.body);

  const guide = await prisma.guide.findUnique({ where: { userId: req.auth!.id } });
  if (!guide) throw ApiError.forbidden('Not a guide');

  const updatedGuide = await prisma.guide.update({
    where: { id: guide.id },
    data: {
      phone: data.phone ?? guide.phone,
      languages: data.languages ?? guide.languages,
      experienceYears: data.experienceYears ?? guide.experienceYears,
      specialization: data.specialization ?? guide.specialization,
      description: data.description ?? guide.description,
      serviceArea: data.serviceArea ?? guide.serviceArea,
      hourlyPricePaise: data.hourlyPricePaise ?? guide.hourlyPricePaise,
      halfDayPricePaise: data.halfDayPricePaise ?? guide.halfDayPricePaise,
      fullDayPricePaise: data.fullDayPricePaise ?? guide.fullDayPricePaise,
      upiId: data.upiId ?? guide.upiId,
    }
  });
  res.json({ guide: updatedGuide });
}));

// PATCH /api/guides/bookings/:id - Accept/Reject booking
guidesRouter.patch('/bookings/:id', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    status: z.enum(['CONFIRMED', 'REJECTED', 'COMPLETED'])
  });
  const { status } = schema.parse(req.body);

  const guide = await prisma.guide.findUnique({ where: { userId: req.auth!.id } });
  if (!guide) throw ApiError.forbidden('Not a guide');

  const booking = await prisma.guideBooking.updateMany({
    where: { id: req.params.id, guideId: guide.id },
    data: { status }
  });

  res.json({ success: true });
}));
