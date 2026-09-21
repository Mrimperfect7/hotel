import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const ridesRouter = Router();

// GET /api/rides - Find nearby drivers (simplified)
ridesRouter.get('/', asyncH(async (req, res) => {
  const drivers = await prisma.driver.findMany({
    where: { status: 'APPROVED', isOnline: true },
    include: { user: { select: { name: true, avatarUrl: true } }, vehicle: true }
  });
  res.json({ data: drivers });
}));

// POST /api/rides/register - Register as driver
ridesRouter.post('/register', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    phone: z.string(),
    licenseNumber: z.string(),
    vehicleType: z.string(),
    vehicleNumber: z.string(),
  });
  const data = schema.parse(req.body);

  if (req.auth!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.auth!.id }, data: { role: 'DRIVER' } });
  }

  const driver = await prisma.driver.create({
    data: {
      userId: req.auth!.id,
      name: req.auth!.name,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      status: 'PENDING',
      vehicle: {
        create: {
          type: data.vehicleType,
          number: data.vehicleNumber
        }
      }
    }
  });

  res.json({ data: driver });
}));

// POST /api/rides/request - Request a ride
ridesRouter.post('/request', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    pickupLocation: z.string(),
    destination: z.string(),
    date: z.string(),
    time: z.string(),
    vehicleType: z.string(),
    passengers: z.number().int().min(1),
    estimatedPaise: z.number().int().optional(),
  });
  const data = schema.parse(req.body);

  const ride = await prisma.ride.create({
    data: {
      customerId: req.auth!.id,
      ...data,
      date: new Date(data.date),
      status: 'REQUESTED'
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.auth!.id } })
    || await prisma.trip.create({ data: { customerId: req.auth!.id, name: "My Guruvayoor Trip" } });

  await prisma.tripItem.create({
    data: {
      tripId: trip.id,
      type: 'RIDE',
      entityId: ride.id,
      dateTime: new Date(`${data.date}T${data.time || '00:00'}:00Z`), // Simplified 
      title: 'Ride Requested',
      subtitle: `${data.pickupLocation} to ${data.destination}`
    }
  });

  res.json({ data: ride });
}));

// PATCH /api/rides/:id/status - Update ride status (Driver)
ridesRouter.patch('/:id/status', requireAuth, asyncH(async (req, res) => {
  const { status } = req.body;
  
  // Basic validation that user is a driver (in real app we'd verify ownership of ride)
  const driver = await prisma.driver.findUnique({ where: { userId: req.auth!.id } });
  if (!driver) throw ApiError.forbidden('Not a driver');

  const ride = await prisma.ride.update({
    where: { id: req.params.id },
    data: { status, driverId: driver.id }
  });
  res.json({ data: ride });
}));

// GET /api/rides/dashboard - Driver dashboard
ridesRouter.get('/dashboard', requireAuth, asyncH(async (req, res) => {
  const driver = await prisma.driver.findUnique({
    where: { userId: req.auth!.id },
    include: { vehicle: true }
  });
  if (!driver) throw ApiError.forbidden('Not registered as driver');

  const rides = await prisma.ride.findMany({
    where: { driverId: driver.id },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const availableRides = await prisma.ride.findMany({
    where: { status: 'REQUESTED' },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const completed = rides.filter(r => r.status === 'RIDE_COMPLETED').length;
  const revenuePaise = rides.filter(r => r.status === 'RIDE_COMPLETED').reduce((acc, r) => acc + (r.finalPaise || r.estimatedPaise || 0), 0);
  const activeRide = rides.find(r => ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'RIDE_STARTED'].includes(r.status));

  res.json({
    driver,
    stats: { completed, revenuePaise },
    activeRide: activeRide || null,
    availableRides,
    recentRides: rides.slice(0, 10)
  });
}));

// PATCH /api/rides/online - Toggle online status
ridesRouter.patch('/online', requireAuth, asyncH(async (req, res) => {
  const { isOnline } = z.object({ isOnline: z.boolean() }).parse(req.body);
  const driver = await prisma.driver.update({
    where: { userId: req.auth!.id },
    data: { isOnline }
  });
  res.json({ isOnline: driver.isOnline });
}));
