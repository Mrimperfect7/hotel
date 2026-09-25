import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const supportRouter = Router();

// POST /api/support/ticket - Create a support ticket (or concierge request)
supportRouter.post('/ticket', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    category: z.string(),
    subject: z.string(),
    description: z.string(),
    tripCode: z.string().optional()
  });
  const data = schema.parse(req.body);

  let tripId = null;
  if (data.tripCode) {
    const trip = await prisma.trip.findUnique({ where: { tripCode: data.tripCode } });
    if (trip) tripId = trip.id;
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: req.auth!.id,
      category: data.category,
      subject: data.subject,
      description: data.description,
      status: 'OPEN',
      tripId
    }
  });

  res.json({ data: ticket });
}));

// GET /api/support/my-tickets - Get user's tickets
supportRouter.get('/my-tickets', requireAuth, asyncH(async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { customerId: req.auth!.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ data: tickets });
}));
