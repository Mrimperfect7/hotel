import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';
import { slugify } from '@gsv/types';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

/** GET /api/admin/stats — platform-wide KPIs for the admin dashboard. */
adminRouter.get(
  '/stats',
  asyncH(async (_req, res) => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [totalHotels, pendingHotels, approvedHotels, rejectedHotels, suspendedHotels, totalCustomers, totalOwners, totalBookings, todaysBookings, upcomingCheckins, cancelledBookings, revenueAgg, commissionAgg] = await Promise.all([
      prisma.hotel.count({ where: { deletedAt: null } }),
      prisma.hotel.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.hotel.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.hotel.count({ where: { status: 'REJECTED', deletedAt: null } }),
      prisma.hotel.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
      prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'HOTEL_OWNER', deletedAt: null } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: 'CONFIRMED', checkIn: { gte: todayStart } } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amountPaise: true } }),
      prisma.booking.aggregate({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] } }, _sum: { commissionPaise: true } }),
    ]);

    res.json({
      hotels: { total: totalHotels, pending: pendingHotels, approved: approvedHotels, rejected: rejectedHotels, suspended: suspendedHotels },
      users: { customers: totalCustomers, owners: totalOwners },
      bookings: { total: totalBookings, today: todaysBookings, upcomingCheckins, cancelled: cancelledBookings },
      revenuePaise: revenueAgg._sum.amountPaise ?? 0,
      commissionPaise: commissionAgg._sum.commissionPaise ?? 0,
    });
  })
);

/** GET /api/admin/hotels?status=PENDING — verification queue & lists. */
adminRouter.get(
  '/hotels',
  asyncH(async (req, res) => {
    const q = z.object({
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED', 'REMOVED']).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      q: z.string().optional(),
    }).parse(req.query);

    const isRemoved = q.status === 'REMOVED';
    const where: Prisma.HotelWhereInput = {
      ...(q.status && !isRemoved ? { status: q.status as never } : {}),
      deletedAt: isRemoved ? { not: null } : null,
      ...(q.q ? { OR: [{ name: { contains: q.q, mode: 'insensitive' as const } }, { slug: { contains: q.q } }] } : {}),
    };

    const [total, hotels] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        orderBy: { submittedAt: 'asc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: {
          owner: true,
          documents: true,
          images: { where: { isCover: true }, take: 1 },
          roomTypes: { where: { deletedAt: null } },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
    ]);

    res.json({
      total, page: q.page, limit: q.limit,
      hotels: hotels.map((h) => ({
        id: h.id, slug: h.slug, name: h.name, status: h.status,
        owner: { name: h.owner.ownerName, phone: h.owner.phone, email: h.owner.email },
        addressLine1: h.addressLine1, city: h.city, pincode: h.pincode,
        lat: h.lat, lng: h.lng, distanceMeters: h.distanceMeters,
        roomCount: h.roomTypes.reduce((s, r) => s + r.totalRooms, 0),
        minPricePaise: h.minPricePaise,
        documents: h.documents,
        coverImage: h.images[0]?.url ?? null,
        bookings: h._count.bookings,
        reviews: h._count.reviews,
        submittedAt: h.submittedAt,
        rejectionReason: h.rejectionReason,
        deletedAt: h.deletedAt,
      })),
    });
  })
);

/** GET /api/admin/hotels/:id — full application detail for review. */
adminRouter.get(
  '/hotels/:id',
  asyncH(async (req, res) => {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { include: { user: { select: { email: true, phone: true, createdAt: true } } } },
        documents: true, images: true,
        amenities: { include: { amenity: true } },
        roomTypes: { where: { deletedAt: null }, include: { amenities: { include: { amenity: true } } } },
      },
    });
    if (!hotel) throw ApiError.notFound('Hotel not found');
    res.json({ hotel });
  })
);

const reviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'SUSPEND', 'ACTIVATE', 'REACTIVATE', 'UNDER_REVIEW', 'DEACTIVATE']),
  reason: z.string().max(1000).optional(),
  edits: z.object({
    name: z.string().min(3).max(120).optional(),
    distanceMeters: z.number().int().min(0).max(50000).optional(),
    commissionBps: z.number().int().min(0).max(5000).optional(),
    isFeatured: z.boolean().optional(),
  }).optional(),
});

/**
 * PATCH /api/admin/hotels/:id — the verification workflow:
 * PENDING → UNDER_REVIEW → APPROVED/REJECTED (+ SUSPEND / REACTIVATE / EDIT).
 * Every transition is audited and the owner is notified.
 */
adminRouter.patch(
  '/hotels/:id',
  asyncH(async (req, res) => {
    const { action, reason, edits } = reviewActionSchema.parse(req.body);
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } });
    if (!hotel || hotel.deletedAt) throw ApiError.notFound('Hotel not found');

    const allowed: Record<string, { from: string[]; to: string; action: string }> = {
      UNDER_REVIEW: { from: ['PENDING'], to: 'UNDER_REVIEW', action: 'HOTEL_UNDER_REVIEW' },
      APPROVE: { from: ['PENDING', 'UNDER_REVIEW'], to: 'APPROVED', action: 'HOTEL_APPROVED' },
      REJECT: { from: ['PENDING', 'UNDER_REVIEW'], to: 'REJECTED', action: 'HOTEL_REJECTED' },
      REQUEST_CHANGES: { from: ['PENDING', 'UNDER_REVIEW'], to: 'UNDER_REVIEW', action: 'HOTEL_CHANGES_REQUESTED' },
      SUSPEND: { from: ['APPROVED'], to: 'SUSPENDED', action: 'HOTEL_SUSPENDED' },
      DEACTIVATE: { from: ['APPROVED', 'SUSPENDED'], to: 'DEACTIVATED', action: 'HOTEL_DEACTIVATED' },
      REACTIVATE: { from: ['SUSPENDED', 'DEACTIVATED'], to: 'APPROVED', action: 'HOTEL_REACTIVATED' },
      ACTIVATE: { from: ['APPROVED'], to: 'APPROVED', action: 'HOTEL_ACTIVATED' },
    };
    const rule = allowed[action];
    if (!rule) throw ApiError.badRequest('Unknown action');
    if (!rule.from.includes(hotel.status)) {
      throw ApiError.conflict(`Cannot ${action.toLowerCase()} a hotel in ${hotel.status}`, 'INVALID_TRANSITION');
    }

    const updated = await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        status: rule.to as never,
        ...(edits?.name ? { name: edits.name, slug: slugify(edits.name) } : {}),
        ...(edits?.distanceMeters != null ? { distanceMeters: edits.distanceMeters } : {}),
        ...(edits?.commissionBps != null ? { commissionBps: edits.commissionBps } : {}),
        ...(edits?.isFeatured != null ? { isFeatured: edits.isFeatured } : {}),
        ...(action === 'REJECT' ? { rejectionReason: reason ?? 'Does not meet listing standards' } : {}),
        ...(action === 'APPROVE' || action === 'REACTIVATE' ? { approvedAt: new Date(), rejectionReason: null } : {}),
        ...(action === 'UNDER_REVIEW' ? { reviewedAt: new Date() } : {}),
      },
    });

    await audit(req, rule.action, 'Hotel', hotel.id, { from: hotel.status, to: rule.to, reason });

    // Notify the owner.
    const ownerUser = await prisma.hotelOwner.findUnique({ where: { id: hotel.ownerId }, select: { userId: true } });
    if (ownerUser) {
      const msgs: Record<string, { type: never; title: string; body: string }> = {
        HOTEL_APPROVED: { type: 'HOTEL_APPROVED' as never, title: `${hotel.name} is live! 🎉`, body: 'Your property passed verification and is now bookable on Namma Guruvayoor.' },
        HOTEL_REJECTED: { type: 'HOTEL_REJECTED' as never, title: `Update on ${hotel.name}`, body: reason ?? 'Your listing was not approved. Contact support for details.' },
        HOTEL_CHANGES_REQUESTED: { type: 'HOTEL_CHANGES_REQUESTED' as never, title: `Changes requested for ${hotel.name}`, body: reason ?? 'Please review the admin feedback.' },
        HOTEL_SUSPENDED: { type: 'GENERIC' as never, title: `${hotel.name} suspended`, body: reason ?? 'Your listing is temporarily suspended.' },
        HOTEL_REACTIVATED: { type: 'HOTEL_APPROVED' as never, title: `${hotel.name} is live again`, body: 'Your listing has been reactivated.' },
      };
      const m = msgs[rule.action];
      if (m) {
        await notify({ userId: ownerUser.userId, type: m.type, title: m.title, body: m.body, channels: ['IN_APP', 'EMAIL'] });
      }
    }

    res.json({ hotel: { id: updated.id, status: updated.status } });
  })
);

/**
 * DELETE /api/admin/hotels/:id — remove a hotel from the platform.
 * ?permanent=true will hard-delete from the database (allowed if 0 active bookings).
 * Default: soft-delete (unlists immediately from public search, detail pages, and collections).
 */
adminRouter.delete(
  '/hotels/:id',
  asyncH(async (req, res) => {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } },
          },
        },
      },
    });
    if (!hotel) throw ApiError.notFound('Hotel not found');

    const permanent = req.query.permanent === 'true';

    if (permanent) {
      if (hotel._count.bookings > 0) {
        throw ApiError.conflict(
          `Cannot permanently delete: hotel has ${hotel._count.bookings} active booking(s). Unlist it instead.`,
          'ACTIVE_BOOKINGS'
        );
      }

      await prisma.$transaction([
        prisma.hotelImage.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.hotelDocument.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.hotelAmenity.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.roomAmenity.deleteMany({ where: { roomType: { hotelId: hotel.id } } }),
        prisma.roomType.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.favorite.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.review.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.commission.deleteMany({ where: { hotelId: hotel.id } }),
        prisma.hotel.delete({ where: { id: hotel.id } }),
      ]);

      await audit(req, 'HOTEL_PERMANENTLY_DELETED', 'Hotel', hotel.id, { name: hotel.name, slug: hotel.slug });
      return res.json({ success: true, message: `Hotel "${hotel.name}" was permanently removed.` });
    }

    const updated = await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });

    await audit(req, 'HOTEL_REMOVED', 'Hotel', hotel.id, { name: hotel.name, previousStatus: hotel.status });

    // Notify the owner
    const ownerUser = await prisma.hotelOwner.findUnique({ where: { id: hotel.ownerId }, select: { userId: true } });
    if (ownerUser) {
      await notify({
        userId: ownerUser.userId,
        type: 'GENERIC' as never,
        title: `${hotel.name} unlisted`,
        body: 'Your hotel listing has been removed from the platform by the administrator.',
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    res.json({ success: true, message: `Hotel "${hotel.name}" has been unlisted from the platform.` });
  })
);

/** POST /api/admin/hotels/:id/restore — restore an unlisted/removed hotel. */
adminRouter.post(
  '/hotels/:id/restore',
  asyncH(async (req, res) => {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } });
    if (!hotel) throw ApiError.notFound('Hotel not found');

    const updated = await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        deletedAt: null,
        status: 'APPROVED',
      },
    });

    await audit(req, 'HOTEL_RESTORED', 'Hotel', hotel.id, { name: hotel.name });
    res.json({ success: true, hotel: { id: updated.id, status: updated.status } });
  })
);

/** GET /api/admin/bookings — every booking with filters. */
adminRouter.get(
  '/bookings',
  asyncH(async (req, res) => {
    const q = z.object({
      hotelId: z.string().uuid().optional(),
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      code: z.string().optional(),
      customer: z.string().optional(),
    }).parse(req.query);

    const where: Record<string, unknown> = {};
    if (q.hotelId) where.hotelId = q.hotelId;
    if (q.status) where.status = q.status;
    if (q.code) where.bookingCode = { contains: q.code.toUpperCase() };
    if (q.customer) {
      where.OR = [
        { guestName: { contains: q.customer, mode: 'insensitive' } },
        { guestPhone: { contains: q.customer } },
        { guestEmail: { contains: q.customer } },
        { customer: { name: { contains: q.customer, mode: 'insensitive' } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        hotel: { select: { name: true, slug: true, upiId: true } },
        rooms: { include: { roomType: { select: { name: true } } } },
        payments: { select: { id: true, status: true, utr: true } },
        customer: { select: { name: true, phone: true, email: true } },
      },
    });

    res.json({
      bookings: bookings.map((b) => ({
        id: b.id, bookingCode: b.bookingCode, status: b.status,
        hotelName: b.hotel.name,
        hotelUpiId: b.hotel.upiId,
        customerName: b.customer?.name ?? b.guestName,
        customerPhone: b.customer?.phone ?? b.guestPhone,
        roomName: b.rooms[0]?.roomType.name ?? '',
        checkIn: b.checkIn, checkOut: b.checkOut,
        guests: b.guests, roomsCount: b.roomsCount,
        totalPaise: b.totalPaise, commissionPaise: b.commissionPaise,
        payoutPaise: b.totalPaise - b.commissionPaise,
        paymentStatus: b.payments[0]?.status ?? 'INITIATED',
        paymentId: b.payments[0]?.id,
        utr: b.payments[0]?.utr,
        createdAt: b.createdAt,
      })),
    });
  })
);

/** GET /api/admin/users — directory + block/unblock. */
adminRouter.get(
  '/users',
  asyncH(async (req, res) => {
    const q = z.object({ role: z.enum(['CUSTOMER', 'HOTEL_OWNER']).optional(), q: z.string().optional() }).parse(req.query);
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(q.role ? { role: q.role } : {}),
        ...(q.q ? { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q } }, { phone: { contains: q.q } }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true, createdAt: true },
    });
    res.json({ users });
  })
);

adminRouter.patch(
  '/users/:id/block',
  asyncH(async (req, res) => {
    const { blocked } = z.object({ blocked: z.boolean() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw ApiError.notFound('User not found');
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') throw ApiError.forbidden('Cannot block admins');
    await prisma.user.update({ where: { id: user.id }, data: { isBlocked: blocked } });
    await audit(req, blocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 'User', user.id, { email: user.email });
    res.json({ ok: true });
  })
);

/** GET/PATCH /api/admin/settings — commission %, fees, featured hotels, content. */
adminRouter.get(
  '/settings',
  asyncH(async (_req, res) => {
    const { getSettings } = await import('../lib/settings.js');
    res.json({ settings: await getSettings() });
  })
);

adminRouter.patch(
  '/settings',
  asyncH(async (req, res) => {
    const patch = z.object({
      platformName: z.string().min(2).max(60).optional(),
      commissionBps: z.number().int().min(0).max(5000).optional(),
      bookingFeePaise: z.number().int().min(0).max(100000).optional(),
      maxHotelDistanceMeters: z.number().int().min(100).max(50000).optional(),
      featuredHotelIds: z.array(z.string().uuid()).optional(),
    }).parse(req.body);
    const { updateSettings } = await import('../lib/settings.js');
    const settings = await updateSettings(patch);
    await audit(req, 'SETTINGS_UPDATED', 'PlatformSetting', 'platform', patch);
    res.json({ settings });
  })
);

/** GET /api/admin/reviews + moderation. */
adminRouter.get(
  '/reviews',
  asyncH(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { hotel: { select: { name: true } }, customer: { select: { name: true } } },
    });
    res.json({ reviews });
  })
);

adminRouter.patch(
  '/reviews/:id',
  asyncH(async (req, res) => {
    const { status } = z.object({ status: z.enum(['PUBLISHED', 'HIDDEN', 'FLAGGED']) }).parse(req.body);
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
    await audit(req, 'REVIEW_MODERATED', 'Review', review.id, { status });
    res.json({ review });
  })
);

/** GET /api/admin/audit — audit trail viewer. */
adminRouter.get(
  '/audit',
  asyncH(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { actor: { select: { name: true, role: true } } },
    });
    res.json({ logs });
  })
);

// --- NEW SERVICE APPROVALS ---

adminRouter.post(
  '/users',
  asyncH(async (req, res) => {
    const { name, email, phone, password, role } = z.object({
      name: z.string().min(2),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional().or(z.literal('')),
      password: z.string().min(6),
      role: z.enum(['GUIDE', 'RESTAURANT_OWNER', 'HOTEL_OWNER', 'DRIVER', 'CUSTOMER']),
    }).parse(req.body);

    if (!email && !phone) throw ApiError.badRequest('Email or phone is required');
    const { hashPassword } = await import('../lib/auth.js');
    const passwordHash = await hashPassword(password);
    
    // Convert empty strings to undefined to avoid unique constraint issues
    const safeEmail = email || undefined;
    const safePhone = phone || undefined;

    const user = await prisma.user.create({
      data: {
        name,
        email: safeEmail,
        phone: safePhone,
        passwordHash,
        role,
        ...(role === 'HOTEL_OWNER' && { ownerProfile: { create: { ownerName: name, phone: safePhone || '', email: safeEmail || '' } } }),
        ...(role === 'GUIDE' && { guideProfile: { create: { name, phone: safePhone || '' } } }),
        ...(role === 'DRIVER' && { driverProfile: { create: { name, phone: safePhone || '', licenseNumber: 'PENDING' } } }),
        ...(role === 'RESTAURANT_OWNER' && { restaurantProfile: { create: { name, phone: safePhone || '', slug: `rest-${Date.now()}`, address: 'PENDING' } } }),
      },
    });

    await audit(req, 'USER_CREATED', 'User', user.id, { role });
    res.json({ user });
  })
);

const providerReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE', 'UNDER_REVIEW']),
  reason: z.string().max(1000).optional(),
});

function getProviderStatus(action: string) {
  const map: Record<string, 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'> = {
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    SUSPEND: 'SUSPENDED',
    REACTIVATE: 'APPROVED',
  };
  return map[action];
}

adminRouter.get('/guides', asyncH(async (req, res) => {
  const status = req.query.status as string | undefined;
  const guides = await prisma.guide.findMany({
    where: {
      deletedAt: null,
      ...(status && status !== 'ALL' ? { status: status as never } : {})
    },
    include: { user: { select: { email: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ guides });
}));

adminRouter.patch('/guides/:id', asyncH(async (req, res) => {
  const { action, reason } = providerReviewSchema.parse(req.body);
  const toStatus = getProviderStatus(action);
  if (!toStatus) throw ApiError.badRequest('Unknown action');
  
  const guide = await prisma.guide.update({
    where: { id: req.params.id },
    data: { 
      status: toStatus,
      ...(action === 'REJECT' ? { rejectionReason: reason } : {})
    },
    include: { user: { select: { email: true } } }
  });
  await audit(req, `GUIDE_${action}`, 'Guide', guide.id, { to: toStatus, reason });
  res.json({ guide });
}));

adminRouter.get('/drivers', asyncH(async (req, res) => {
  const status = req.query.status as string | undefined;
  const drivers = await prisma.driver.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as never } : {})
    },
    include: { 
      user: { select: { email: true, name: true, phone: true } },
      vehicle: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ drivers });
}));

adminRouter.patch('/drivers/:id', asyncH(async (req, res) => {
  const { action, reason } = providerReviewSchema.parse(req.body);
  const toStatus = getProviderStatus(action);
  if (!toStatus) throw ApiError.badRequest('Unknown action');
  
  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status: toStatus },
    include: { user: { select: { email: true } } }
  });
  await audit(req, `DRIVER_${action}`, 'Driver', driver.id, { to: toStatus, reason });
  res.json({ driver });
}));

adminRouter.get('/restaurants', asyncH(async (req, res) => {
  const status = req.query.status as string | undefined;
  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as never } : {})
    },
    include: { user: { select: { email: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ restaurants });
}));

adminRouter.patch('/restaurants/:id', asyncH(async (req, res) => {
  const { action, reason } = providerReviewSchema.parse(req.body);
  const toStatus = getProviderStatus(action);
  if (!toStatus) throw ApiError.badRequest('Unknown action');
  
  const restaurant = await prisma.restaurant.update({
    where: { id: req.params.id },
    data: { status: toStatus },
    include: { user: { select: { email: true } } }
  });
  await audit(req, `RESTAURANT_${action}`, 'Restaurant', restaurant.id, { to: toStatus, reason });
  res.json({ restaurant });
}));
