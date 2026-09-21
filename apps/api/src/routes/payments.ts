import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js';
import { generateUpiUri } from '../lib/payments.js';
import { notify } from '../lib/notify.js';
import { audit } from '../lib/audit.js';

export const paymentsRouter = Router();

// Ensure the platform has a central UPI ID in .env, fallback to a dummy for dev
const PLATFORM_UPI_ID = process.env.PLATFORM_UPI_ID || 'nammaguruvayoor@ybl';
const PLATFORM_UPI_NAME = process.env.PLATFORM_UPI_NAME || 'Namma Guruvayoor';

/**
 * POST /api/payments/create
 * Generates a UPI payment URI for a booking. Amount is read from DB.
 */
paymentsRouter.post(
  '/create',
  requireAuth,
  asyncH(async (req, res) => {
    const { bookingId } = z.object({ bookingId: z.string().uuid() }).parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, hotel: true },
    });
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customerId !== req.auth!.id) throw ApiError.forbidden();
    if (booking.status !== 'PENDING') {
      throw ApiError.conflict(`Cannot pay for a ${booking.status.toLowerCase()} booking`, 'BOOKING_NOT_PAYABLE');
    }

    const upiUri = generateUpiUri({
      payeeAddress: PLATFORM_UPI_ID,
      payeeName: PLATFORM_UPI_NAME,
      transactionNote: booking.bookingCode,
      amountPaise: booking.totalPaise,
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'MOCK', // Re-using MOCK since it's manual
        status: 'INITIATED',
        amountPaise: booking.totalPaise,
        upiId: PLATFORM_UPI_ID,
      },
    });

    res.json({
      paymentId: payment.id,
      upiUri,
      amountPaise: booking.totalPaise,
    });
  })
);

/**
 * POST /api/payments/confirm
 * Customer submits their 12-digit UTR after paying via UPI.
 * Marks the payment as PENDING_VERIFICATION.
 */
paymentsRouter.post(
  '/confirm',
  requireAuth,
  asyncH(async (req, res) => {
    const body = z.object({
      paymentId: z.string().uuid(),
      utr: z.string().min(12).max(20),
    }).parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: { booking: true },
    });
    if (!payment) throw ApiError.notFound('Payment not found');
    if (!payment.booking || payment.booking.customerId !== req.auth!.id) throw ApiError.forbidden();

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PENDING_VERIFICATION',
        utr: body.utr,
        method: 'upi',
      },
    });

    res.json({ ok: true, status: 'PENDING_VERIFICATION' });
  })
);

/**
 * POST /api/payments/verify (ADMIN ONLY)
 * Admin verifies the UTR matches their bank account and confirms the booking.
 */
paymentsRouter.post(
  '/verify',
  requireAuth,
  requireAdmin,
  asyncH(async (req, res) => {
    const { paymentId, action } = z.object({
      paymentId: z.string().uuid(),
      action: z.enum(['APPROVE', 'REJECT']),
    }).parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });
    if (!payment || !payment.booking) throw ApiError.notFound('Payment not found');

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'CAPTURED' },
        });
        if (payment.booking!.status === 'PENDING') {
          await tx.booking.update({
            where: { id: payment.bookingId! },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
          });
        }
      });

      if (payment.booking.customerId) {
        await notify({
          userId: payment.booking.customerId,
          type: 'PAYMENT_RECEIVED',
          title: `Payment verified — ${payment.booking.bookingCode}`,
          body: `₹${(payment.booking.totalPaise / 100).toFixed(0)} received. Your booking is confirmed.`,
          channels: ['IN_APP', 'EMAIL'],
        });
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: 'Admin rejected UTR verification' },
      });
    }

    res.json({ ok: true });
  })
);
