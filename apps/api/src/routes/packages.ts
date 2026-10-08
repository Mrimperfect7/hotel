import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const packagesRouter = Router();

// GET /api/packages - List available packages
packagesRouter.get('/', asyncH(async (req, res) => {
  const packages = await prisma.journeyPackage.findMany({
    where: { isActive: true },
    include: { items: true }
  });
  res.json({ data: packages });
}));

// GET /api/packages/:slug - Get a single package
packagesRouter.get('/:slug', asyncH(async (req, res) => {
  const pkg = await prisma.journeyPackage.findUnique({
    where: { slug: req.params.slug },
    include: { items: true }
  });
  if (!pkg) throw ApiError.notFound('Package not found');
  res.json({ data: pkg });
}));

// POST /api/packages/:id/book - Book a package
packagesRouter.post('/:id/book', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    date: z.string(),
    travelers: z.number().int().min(1),
  });
  const { date, travelers } = schema.parse(req.body);

  const pkg = await prisma.journeyPackage.findUnique({
    where: { id: req.params.id },
    include: { items: true }
  });

  if (!pkg) throw ApiError.notFound('Package not found');
  if (!pkg.isActive) throw ApiError.badRequest('Package is no longer active');
  if (travelers < pkg.minTravelers) throw ApiError.badRequest(`Minimum ${pkg.minTravelers} travelers required`);
  if (travelers > pkg.maxTravelers) throw ApiError.badRequest(`Maximum ${pkg.maxTravelers} travelers allowed`);

  // Create the package booking
  const booking = await prisma.packageBooking.create({
    data: {
      packageId: pkg.id,
      customerId: req.auth!.id,
      date: new Date(date),
      travelers,
      totalPaise: pkg.pricePaise * travelers - (pkg.discountPaise * travelers),
      status: 'PENDING'
    }
  });

  // Create or attach to a Trip
  const tripCode = `NMG-PKG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const trip = await prisma.trip.create({
    data: {
      customerId: req.auth!.id,
      name: pkg.name,
      tripCode,
      startDate: new Date(date),
    }
  });

  // Link the booking to the trip
  await prisma.packageBooking.update({
    where: { id: booking.id },
    data: { tripId: trip.id }
  });

  // Generate trip items based on package inclusions
  const tripItems = pkg.items.map((item, index) => ({
    tripId: trip.id,
    type: item.serviceType as any, // HOTEL, RIDE, GUIDE, FOOD, etc
    entityId: booking.id, // Using booking ID as a proxy for the actual service booking for now
    dateTime: new Date(new Date(date).getTime() + index * 3600000), // Stagger times slightly
    title: item.description,
    subtitle: `Included in ${pkg.name}`
  }));

  await prisma.tripItem.createMany({ data: tripItems });

  res.json({ data: { booking, trip } });
}));
