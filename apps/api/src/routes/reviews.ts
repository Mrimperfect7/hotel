import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { reviewLimiter } from '../middleware/rateLimiters.js';
import { reviewSchema } from '@gsv/types';

export const reviewsRouter = Router();
export const miscRouter = Router();

/**
 * POST /api/reviews — one review per COMPLETED booking, tied to the
 * authenticated customer. Rating aggregates are recomputed transactionally.
 */
reviewsRouter.post(
  '/',
  requireAuth,
  reviewLimiter,
  asyncH(async (req, res) => {
    const body = reviewSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { review: true },
    });
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customerId !== req.auth!.id) throw ApiError.forbidden('You can only review your own stays');
    if (booking.status !== 'COMPLETED') {
      throw ApiError.conflict('Only completed stays can be reviewed', 'BOOKING_NOT_COMPLETED');
    }
    if (booking.review) throw ApiError.conflict('You already reviewed this stay', 'REVIEW_EXISTS');

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId: booking.id,
          hotelId: booking.hotelId,
          customerId: req.auth!.id,
          overall: body.overall,
          cleanliness: body.cleanliness,
          location: body.location,
          staff: body.staff,
          value: body.value,
          comment: body.comment,
        },
      });
      const agg = await tx.review.aggregate({
        where: { hotelId: booking.hotelId, status: 'PUBLISHED' },
        _avg: { overall: true },
        _count: true,
      });
      await tx.hotel.update({
        where: { id: booking.hotelId },
        data: {
          ratingAvg: Math.round((agg._avg.overall ?? 0) * 10) / 10,
          reviewCount: agg._count,
        },
      });
      return created;
    });

    res.status(201).json({ review });
  })
);

/** GET /api/reviews/hotel/:hotelId */
reviewsRouter.get(
  '/hotel/:hotelId',
  asyncH(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { hotelId: req.params.hotelId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { customer: { select: { name: true } } },
    });
    res.json({
      reviews: reviews.map((r) => ({ ...r, customer: undefined, customerName: r.customer?.name ?? 'Guest' })),
    });
  })
);

// ── Favorites, notifications, device tokens (shared misc router) ─────────────

/** GET /api/me/favorites */
miscRouter.get(
  '/favorites',
  requireAuth,
  asyncH(async (req, res) => {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.auth!.id },
      include: {
        hotel: {
          select: { id: true, slug: true, name: true, minPricePaise: true, ratingAvg: true, distanceMeters: true, status: true,
            images: { where: { isCover: true }, take: 1 } },
        },
      },
    });
    res.json({
      favorites: favs
        .filter((f) => f.hotel.status === 'APPROVED')
        .map((f) => ({
          hotelId: f.hotel.id, slug: f.hotel.slug, name: f.hotel.name,
          minPricePaise: f.hotel.minPricePaise, rating: f.hotel.ratingAvg,
          distanceMeters: f.hotel.distanceMeters,
          coverImage: f.hotel.images[0]?.url ?? null,
        })),
    });
  })
);

/** POST /api/me/favorites/:hotelId | DELETE — toggle saved hotels. */
miscRouter.post(
  '/favorites/:hotelId',
  requireAuth,
  asyncH(async (req, res) => {
    const hotelId = z.string().uuid().parse(req.params.hotelId);
    await prisma.favorite.upsert({
      where: { userId_hotelId: { userId: req.auth!.id, hotelId } },
      update: {},
      create: { userId: req.auth!.id, hotelId },
    });
    res.json({ ok: true });
  })
);

miscRouter.delete(
  '/favorites/:hotelId',
  requireAuth,
  asyncH(async (req, res) => {
    await prisma.favorite.deleteMany({ where: { userId: req.auth!.id, hotelId: req.params.hotelId } });
    res.json({ ok: true });
  })
);

/** GET /api/me/notifications */
miscRouter.get(
  '/notifications',
  requireAuth,
  asyncH(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.auth!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    res.json({ notifications, unread });
  })
);

/** POST /api/me/notifications/read */
miscRouter.post(
  '/notifications/read',
  requireAuth,
  asyncH(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  })
);

/** POST /api/me/devices — register an FCM token for push. */
miscRouter.post(
  '/devices',
  requireAuth,
  asyncH(async (req, res) => {
    const { token, platform } = z.object({
      token: z.string().min(10).max(500),
      platform: z.enum(['android', 'ios', 'web']).default('android'),
    }).parse(req.body);
    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId: req.auth!.id },
      create: { userId: req.auth!.id, token, platform },
    });
    res.json({ ok: true });
  })
);
