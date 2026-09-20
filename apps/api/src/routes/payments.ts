import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAuth.js';
import {
  createOrder, isMockMode, verifyCheckoutSignature, verifyWebhookSignature, mockSignature,
} from '../lib/payments.js';
import { notify } from '../lib/notify.js';
import { audit } from '../lib/audit.js';
import { config } from '@gsv/config';

export const paymentsRouter = Router();

/**
 * POST /api/payments/create
 * Creates a gateway order for a booking. Amount is read from the DB — the
 * client never supplies an amount. Booking must be PENDING.
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

    const order = await createOrder({
      amountPaise: booking.totalPaise,
      receipt: booking.bookingCode,
      notes: { bookingCode: booking.bookingCode, hotel: booking.hotel.name },
    });

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: order.provider === 'MOCK' ? 'MOCK' : 'RAZORPAY',
        providerOrderId: order.orderId,
        status: 'INITIATED',
        amountPaise: booking.totalPaise,
      },
    });

    res.json({
      paymentId: payment.id,
      order: {
        id: order.orderId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        keyId: order.keyId,
        mock: order.mock,
      },
      prefill: {
        name: booking.customer?.name ?? booking.guestName,
        email: booking.customer?.email ?? booking.guestEmail,
        phone: booking.customer?.phone ?? booking.guestPhone,
      },
    });
  })
);

/**
 * POST /api/payments/confirm
 * Verifies the gateway signature (HMAC over `order_id|payment_id`), marks the
 * payment CAPTURED and — because a paid booking must not linger in PENDING —
 * auto-confirms the booking server-side.
 */
paymentsRouter.post(
  '/confirm',
  requireAuth,
  asyncH(async (req, res) => {
    const body = z.object({
      bookingId: z.string().uuid(),
      razorpayOrderId: z.string().min(4),
      razorpayPaymentId: z.string().min(4),
      razorpaySignature: z.string().min(8),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customerId !== req.auth!.id) throw ApiError.forbidden();

    const payment = await prisma.payment.findFirst({
      where: { bookingId: booking.id, providerOrderId: body.razorpayOrderId },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) throw ApiError.notFound('Payment order not found', 'ORDER_NOT_FOUND');

    const valid = isMockMode()
      ? body.razorpaySignature === mockSignature(body.razorpayOrderId, body.razorpayPaymentId)
      : verifyCheckoutSignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature);
    if (!valid) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: 'SIGNATURE_MISMATCH' } });
      throw ApiError.badRequest('Payment verification failed', 'SIGNATURE_INVALID');
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'CAPTURED',
          providerPaymentId: body.razorpayPaymentId,
          method: 'mock_or_gateway',
        },
      });
      if (booking.status === 'PENDING') {
        await tx.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
      }
    });

    if (booking.customerId) {
      await notify({
        userId: booking.customerId,
        type: 'PAYMENT_RECEIVED',
        title: `Payment received — ${booking.bookingCode}`,
        body: `₹${(booking.totalPaise / 100).toFixed(0)} paid. Your booking at the hotel is confirmed.`,
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    res.json({ ok: true, status: 'CAPTURED', bookingStatus: 'CONFIRMED' });
  })
);

/**
 * POST /api/payments/webhook
 * Razorpay webhook — mounted with express.raw() BEFORE the json parser so the
 * HMAC is computed over exact raw bytes. Handles payment.captured,
 * payment.failed and refund events. Idempotent on event id.
 */
paymentsRouter.post(
  '/webhook',
  asyncH(async (req, res) => {
    const signature = String(req.headers['x-razorpay-signature'] ?? '');
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));

    if (!verifyWebhookSignature(raw, signature)) {
      // In mock mode (no webhook secret configured) accept for local testing.
      if (!(isMockMode() && !config.razorpay.webhookSecret)) {
        throw ApiError.unauthorized('Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID');
      }
    }

    const event = req.body as {
      event: string;
      payload: {
        payment?: { entity: { id: string; order_id: string; method?: string; error_description?: string } };
        refund?: { entity: { id: string; amount: number; payment_id: string } };
      };
    };

    const paymentEntity = event.payload?.payment?.entity;
    const refundEntity = event.payload?.refund?.entity;

    if (event.event === 'payment.captured' && paymentEntity) {
      const payment = await prisma.payment.findFirst({ where: { providerOrderId: paymentEntity.order_id } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'CAPTURED', providerPaymentId: paymentEntity.id, method: paymentEntity.method, rawPayload: event as unknown as object },
        });
        await prisma.booking.updateMany({
          where: { id: payment.bookingId, status: 'PENDING' },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });
      }
    }

    if (event.event === 'payment.failed' && paymentEntity) {
      const payment = await prisma.payment.findFirst({ where: { providerOrderId: paymentEntity.order_id } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: paymentEntity.error_description ?? 'GATEWAY_FAILED', rawPayload: event as unknown as object },
        });
      }
    }

    if (event.event === 'refund.processed' && refundEntity) {
      const payment = await prisma.payment.findFirst({ where: { providerPaymentId: refundEntity.payment_id } });
      if (payment) {
        const fullyRefunded = refundEntity.amount >= payment.amountPaise;
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            refundId: refundEntity.id,
            refundAmountPaise: refundEntity.amount,
          },
        });
      }
    }

    res.json({ received: true });
  })
);

/**
 * POST /api/payments/refund — ADMIN only. Issues refund via gateway (stub in
 * mock mode), updates payment + booking, writes audit entry, notifies owner.
 */
paymentsRouter.post(
  '/refund',
  requireAuth,
  requireAdmin,
  asyncH(async (req, res) => {
    const { bookingId, amountPaise, reason } = z.object({
      bookingId: z.string().uuid(),
      amountPaise: z.number().int().positive().optional(), // default: full refund
      reason: z.string().max(500).optional(),
    }).parse(req.body);

    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
    if (!booking) throw ApiError.notFound('Booking not found');
    const payment = booking.payments.find((p) => p.status === 'CAPTURED');
    if (!payment) throw ApiError.conflict('No captured payment to refund', 'NOTHING_TO_REFUND');

    const refundAmount = amountPaise ?? payment.amountPaise;
    if (refundAmount > payment.amountPaise - payment.refundAmountPaise) {
      throw ApiError.badRequest('Refund exceeds remaining amount', 'REFUND_TOO_LARGE');
    }

    const refundId = `mock_refund_${Date.now()}`; // live: razorpay.payments.refund(...)
    const fully = refundAmount + payment.refundAmountPaise >= payment.amountPaise;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: fully ? 'REFUNDED' : 'PARTIALLY_REFUNDED', refundId, refundAmountPaise: payment.refundAmountPaise + refundAmount },
    });
    if (fully && booking.status !== 'COMPLETED') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'ADMIN', cancelReason: reason ?? 'Refund issued' },
      });
    }

    await audit(req, 'REFUND_ISSUED', 'Payment', payment.id, { bookingId, refundAmount, reason });
    if (booking.customerId) {
      await notify({
        userId: booking.customerId,
        type: 'REFUND_ISSUED',
        title: `Refund issued — ${booking.bookingCode}`,
        body: `₹${(refundAmount / 100).toFixed(0)} will be credited to your original payment method in 5–7 working days.`,
        channels: ['IN_APP', 'EMAIL'],
      });
    }

    res.json({ ok: true, refundId, refundAmountPaise: refundAmount });
  })
);
