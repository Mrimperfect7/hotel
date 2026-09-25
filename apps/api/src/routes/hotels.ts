import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { searchSchema, slugify, TEMPLE_DISTANCE_BANDS, rupeesToPaise } from '@gsv/types';
import { templeDistanceMeters } from '../lib/geo.js';

export const hotelsRouter = Router();

/** GET /api/hotels — public search & discovery with temple-centric filters. */
hotelsRouter.get(
  '/',
  asyncH(async (req, res) => {
    const q = searchSchema.parse(req.query);
    const where: Prisma.HotelWhereInput = { status: 'APPROVED', deletedAt: null };

    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
        { addressLine1: { contains: q.q, mode: 'insensitive' } },
      ];
    }
    if (q.minPrice != null || q.maxPrice != null) {
      where.minPricePaise = {
        gte: q.minPrice != null ? q.minPrice * 100 : undefined,
        lte: q.maxPrice != null ? q.maxPrice * 100 : undefined,
      };
    }
    if (q.minRating) where.ratingAvg = { gte: q.minRating };

    const band = TEMPLE_DISTANCE_BANDS.find((b) => b.key === q.band);
    if (band) where.distanceMeters = { gte: band.min, lte: band.max };

    if (q.amenities) {
      const keys = q.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      if (keys.length) where.amenities = { some: { amenity: { key: { in: keys } } } };
    }
    if (q.ac) where.roomTypes = { some: { acAvailable: true, deletedAt: null } };

    const orderBy: Prisma.HotelOrderByWithRelationInput =
      q.sort === 'nearest' ? { distanceMeters: 'asc' } :
      q.sort === 'price_asc' ? { minPricePaise: 'asc' } :
      q.sort === 'rating' ? { ratingAvg: 'desc' } :
      { isFeatured: 'desc' };

    const [total, hotels] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        orderBy: [orderBy, { name: 'asc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: {
          images: { where: { isCover: true }, take: 1 },
          roomTypes: { where: { deletedAt: null }, select: { name: true, basePricePaise: true, acAvailable: true } },
          amenities: { include: { amenity: true } },
        },
      }),
    ]);

    res.json({
      total, page: q.page, limit: q.limit,
      hotels: hotels.map((h) => ({
        id: h.id,
        slug: h.slug,
        name: h.name,
        coverImage: h.images[0]?.url ?? null,
        distanceMeters: h.distanceMeters,
        rating: h.ratingAvg,
        reviewCount: h.reviewCount,
        minPricePaise: h.minPricePaise,
        roomTypes: h.roomTypes.map((r) => ({ name: r.name, pricePaise: r.basePricePaise, ac: r.acAvailable })),
        amenities: h.amenities.map((a) => a.amenity.key),
        isFeatured: h.isFeatured,
        isVerified: h.isVerified,
      })),
    });
  })
);

/** GET /api/hotels/meta/filters — amenity keys + distance bands for the UI. */
hotelsRouter.get(
  '/meta/filters',
  asyncH(async (_req, res) => {
    const amenities = await prisma.amenity.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ amenities, bands: TEMPLE_DISTANCE_BANDS });
  })
);

/** GET /api/hotels/:slug — full detail for the premium hotel page. */
hotelsRouter.get(
  '/:slug',
  asyncH(async (req, res) => {
    const hotel = await prisma.hotel.findFirst({
      where: { slug: req.params.slug, status: 'APPROVED', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { include: { amenity: true } },
        roomTypes: {
          where: { deletedAt: null },
          include: { amenities: { include: { amenity: true } } },
          orderBy: { basePricePaise: 'asc' },
        },
        reviews: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { customer: { select: { name: true } } },
        },
      },
    });
    if (!hotel) throw ApiError.notFound('Hotel not found', 'HOTEL_NOT_FOUND');

    const activeBooked = await prisma.bookingRoom.groupBy({
      by: ['roomTypeId'],
      where: {
        roomTypeId: { in: hotel.roomTypes.map((r) => r.id) },
        booking: { status: { in: ['PENDING', 'CONFIRMED'] }, checkOut: { gt: new Date() } },
      },
      _sum: { roomsCount: true },
    });
    const bookedMap = new Map(activeBooked.map((b) => [b.roomTypeId, b._sum.roomsCount ?? 0]));

    res.json({
      hotel: {
        id: hotel.id, slug: hotel.slug, name: hotel.name, description: hotel.description,
        status: hotel.status, addressLine1: hotel.addressLine1, addressLine2: hotel.addressLine2,
        city: hotel.city, state: hotel.state, pincode: hotel.pincode,
        lat: hotel.lat, lng: hotel.lng, distanceMeters: hotel.distanceMeters,
        checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime,
        cancellationPolicyText: hotel.cancellationPolicyText, refundPolicy: hotel.refundPolicy,
        hotelRules: hotel.hotelRules, starRating: hotel.starRating,
        ratingAvg: hotel.ratingAvg, reviewCount: hotel.reviewCount,
        contactPhone: hotel.contactPhone, contactEmail: hotel.contactEmail, whatsapp: hotel.whatsapp,
        images: hotel.images,
        amenities: hotel.amenities.map((a) => a.amenity),
        reviews: hotel.reviews.map((r) => ({ ...r, customer: undefined, customerName: r.customer?.name ?? 'Guest' })),
        roomTypes: hotel.roomTypes.map((r) => ({
          id: r.id, name: r.name, slug: r.slug, description: r.description,
          basePricePaise: r.basePricePaise, maxOccupancy: r.maxOccupancy,
          bedType: r.bedType, roomSizeSqft: r.roomSizeSqft, acAvailable: r.acAvailable,
          totalRooms: r.totalRooms, blockedRooms: r.blockedRooms,
          availableNow: Math.max(0, r.totalRooms - r.blockedRooms - (bookedMap.get(r.id) ?? 0)),
          images: r.images, amenities: r.amenities.map((ra) => ra.amenity),
        })),
      },
    });
  })
);

// ── Owner-facing hotel registration wizard ───────────────────────────────────

const roomSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  basePrice: z.number().min(199).max(100000),
  maxOccupancy: z.number().int().min(1).max(10),
  bedType: z.string().min(2).max(40),
  roomSizeSqft: z.number().int().min(50).max(5000).optional(),
  acAvailable: z.boolean().default(false),
  totalRooms: z.number().int().min(1).max(200),
});

const wizardSchema = z.object({
  owner: z.object({
    ownerName: z.string().min(2).max(80),
    phone: z.string().min(10).max(15),
    whatsapp: z.string().max(15).optional(),
    email: z.string().email(),
    gstin: z.string().max(20).optional(),
    panNumber: z.string().max(20).optional(),
  }),
  property: z.object({
    name: z.string().min(3).max(120),
    description: z.string().max(4000).optional(),
    addressLine1: z.string().min(5),
    addressLine2: z.string().optional(),
    pincode: z.string().regex(/^\d{6}$/),
    starRating: z.number().int().min(0).max(5).default(0),
    checkInTime: z.string().default('12:00'),
    checkOutTime: z.string().default('11:00'),
    cancellationPolicyText: z.string().max(3000).optional(),
    refundPolicy: z.enum(['FREE_CANCEL_24H', 'FREE_CANCEL_48H', 'MODERATE', 'STRICT', 'NON_REFUNDABLE']).default('MODERATE'),
    hotelRules: z.string().max(3000).optional(),
    contactPhone: z.string().min(10).max(15),
    contactEmail: z.string().email(),
    whatsapp: z.string().max(15).optional(),
    mapUrl: z.string().url().optional(),
  }),
  location: z.object({
    lat: z.number().min(8).max(12),
    lng: z.number().min(74).max(78),
  }),
  rooms: z.array(roomSchema).min(1).max(20),
  amenityKeys: z.array(z.string()).max(40).default([]),
  documents: z.array(z.object({
    docType: z.string().min(2).max(40),
    url: z.string().min(1).max(500),
    docNumber: z.string().max(60).optional(),
  })).max(10).default([]),
  bank: z.object({
    accountName: z.string().min(2).max(80),
    accountNumber: z.string().min(6).max(30),
    ifsc: z.string().min(6).max(15),
    bankName: z.string().min(2).max(80),
    upiId: z.string().max(60).optional(),
  }),
});

/** POST /api/hotels/register — 10-step wizard payload → PENDING hotel. */
hotelsRouter.post(
  '/register',
  requireAuth,
  asyncH(async (req, res) => {
    const body = wizardSchema.parse(req.body);

    const hotel = await prisma.$transaction(async (tx) => {
      // Upsert owner profile keyed by the authenticated user.
      const owner = await tx.hotelOwner.upsert({
        where: { userId: req.auth!.id },
        update: {
          ownerName: body.owner.ownerName,
          phone: body.owner.phone,
          whatsapp: body.owner.whatsapp,
          email: body.owner.email,
          gstin: body.owner.gstin,
          panNumber: body.owner.panNumber,
        },
        create: { userId: req.auth!.id, ...body.owner },
      });

      // Unique slug with collision fallback.
      let slug = slugify(body.property.name);
      const clash = await tx.hotel.findFirst({ where: { slug } });
      if (clash) slug = `${slug}-${Math.floor(Math.random() * 9000 + 1000)}`;

      return tx.hotel.create({
        data: {
          ownerId: owner.id,
          slug,
          name: body.property.name,
          description: body.property.description,
          status: 'PENDING',
          addressLine1: body.property.addressLine1,
          addressLine2: body.property.addressLine2,
          pincode: body.property.pincode,
          lat: body.location.lat,
          lng: body.location.lng,
          distanceMeters: templeDistanceMeters(body.location.lat, body.location.lng),
          starRating: body.property.starRating,
          checkInTime: body.property.checkInTime,
          checkOutTime: body.property.checkOutTime,
          cancellationPolicyText: body.property.cancellationPolicyText ?? 'Moderate: free cancellation up to 48h before check-in.',
          refundPolicy: body.property.refundPolicy,
          hotelRules: body.property.hotelRules,
          contactPhone: body.property.contactPhone,
          contactEmail: body.property.contactEmail.toLowerCase(),
          whatsapp: body.property.whatsapp,
          mapUrl: body.property.mapUrl,
          submittedAt: new Date(),
          images: { create: [] },
          documents: { create: body.documents },
          amenities: {
            create: body.amenityKeys.map((key) => ({ amenity: { connect: { key } } })),
          },
          roomTypes: {
            create: body.rooms.map((r) => ({
              name: r.name,
              slug: slugify(r.name),
              description: r.description,
              basePricePaise: rupeesToPaise(r.basePrice),
              maxOccupancy: r.maxOccupancy,
              bedType: r.bedType,
              roomSizeSqft: r.roomSizeSqft,
              acAvailable: r.acAvailable,
              totalRooms: r.totalRooms,
              images: [],
            })),
          },
        },
        include: { roomTypes: true },
      });
    });

    // Denormalize min price for search sort/filter.
    const min = Math.min(...hotel.roomTypes.map((r) => r.basePricePaise));
    await prisma.hotel.update({ where: { id: hotel.id }, data: { minPricePaise: min } });

    res.status(201).json({ hotelId: hotel.id, status: 'PENDING', message: 'Your property is currently under admin verification.' });
  })
);
