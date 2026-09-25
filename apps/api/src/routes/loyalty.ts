import { Router } from 'express';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const loyaltyRouter = Router();

// GET /api/loyalty/me - Get current user's loyalty account & status
loyaltyRouter.get('/me', requireAuth, asyncH(async (req, res) => {
  let account = await prisma.loyaltyAccount.findUnique({
    where: { customerId: req.auth!.id },
    include: { tier: true, transactions: { orderBy: { createdAt: 'desc' } } }
  });

  // If no account exists, we could check for completed bookings to bootstrap one
  if (!account) {
    const completedBookings = await prisma.booking.count({
      where: { customerId: req.auth!.id, status: 'COMPLETED' }
    });
    
    // Find highest eligible tier
    const eligibleTier = await prisma.loyaltyTier.findFirst({
      where: { minBookings: { lte: completedBookings }, isActive: true },
      orderBy: { minBookings: 'desc' }
    });

    if (eligibleTier) {
      account = await prisma.loyaltyAccount.create({
        data: {
          customerId: req.auth!.id,
          tierId: eligibleTier.id,
          completedBookings
        },
        include: { tier: true, transactions: true }
      });
    }
  }

  res.json({ data: account });
}));

// POST /api/loyalty/refresh - Trigger recalculation of loyalty points/tiers (Admin only or system worker)
loyaltyRouter.post('/refresh/:customerId', requireAuth, asyncH(async (req, res) => {
  if (req.auth!.role !== 'ADMIN' && req.auth!.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Admin only');
  }
  
  const customerId = req.params.customerId as string;
  
  // Example recalculation logic for completed hotel bookings:
  const completedBookings = await prisma.booking.count({
    where: { customerId, status: 'COMPLETED' }
  });

  const eligibleTier = await prisma.loyaltyTier.findFirst({
    where: { minBookings: { lte: completedBookings }, isActive: true },
    orderBy: { minBookings: 'desc' }
  });

  if (!eligibleTier) {
    return res.json({ message: 'No eligible tier' });
  }

  const account = await prisma.loyaltyAccount.upsert({
    where: { customerId },
    create: {
      customerId,
      tierId: eligibleTier.id,
      completedBookings
    },
    update: {
      tierId: eligibleTier.id,
      completedBookings
    },
    include: { tier: true }
  });

  res.json({ data: account });
}));
