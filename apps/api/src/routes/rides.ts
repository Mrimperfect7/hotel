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

  if (req.user!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.user!.id }, data: { role: 'DRIVER' } });
  }

  const driver = await prisma.driver.create({
    data: {
      userId: req.user!.id,
      name: req.user!.name,
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
      customerId: req.user!.id,
      ...data,
      date: new Date(data.date),
      status: 'REQUESTED'
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.user!.id } })
    || await prisma.trip.create({ data: { customerId: req.user!.id, name: "My Guruvayoor Trip" } });

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
  const driver = await prisma.driver.findUnique({ where: { userId: req.user!.id } });
  if (!driver) throw new ApiError('Not a driver', 403);

  const ride = await prisma.ride.update({
    where: { id: req.params.id },
    data: { status, driverId: driver.id }
  });
  res.json({ data: ride });
}));
