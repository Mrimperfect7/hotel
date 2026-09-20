/**
 * Payment gateway abstraction (Razorpay for India).
 *
 * MOCK mode (default in dev, PAYMENT_MOCK=1): orders are simulated so the full
 * booking → pay → confirm → notify loop works without keys.
 * LIVE mode: real Razorpay Orders API + HMAC-SHA256 webhook verification.
 * Raw card data NEVER touches our servers (gateway checkout handles it).
 */
import crypto from 'node:crypto';
import { config } from '@gsv/config';

export type CreateOrderInput = {
  amountPaise: number;
  receipt: string; // booking code
  notes?: Record<string, string>;
};

export type GatewayOrder = {
  provider: 'RAZORPAY' | 'MOCK';
  orderId: string;
  keyId?: string;
  amountPaise: number;
  currency: 'INR';
  mock: boolean;
};

let razorpay: { orders: { create: (o: unknown) => Promise<{ id: string }> } } | null = null;

async function getRazorpay() {
  if (razorpay) return razorpay;
  const Razorpay = (await import('razorpay')).default;
  razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  }) as unknown as { orders: { create: (o: unknown) => Promise<{ id: string }> } };
  return razorpay;
}

export function isMockMode(): boolean {
  return config.paymentMock || !config.razorpay.keyId || !config.razorpay.keySecret;
}

export async function createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
  if (isMockMode()) {
    return {
      provider: 'MOCK',
      orderId: `mock_order_${crypto.randomBytes(8).toString('hex')}`,
      amountPaise: input.amountPaise,
      currency: 'INR',
      mock: true,
    };
  }
  const rzp = await getRazorpay();
  const order = await rzp.orders.create({
    amount: input.amountPaise,
    currency: 'INR',
    receipt: input.receipt,
    notes: input.notes ?? {},
  });
  return {
    provider: 'RAZORPAY',
    orderId: order.id,
    keyId: config.razorpay.keyId,
    amountPaise: input.amountPaise,
    currency: 'INR',
    mock: false,
  };
}

/** Verify razorpay_payment_id / razorpay_order_id / razorpay_signature trio (checkout callback). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (isMockMode()) return true;
  const secret = config.razorpay.keySecret;
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Verify the X-Razorpay-Signature header over the RAW webhook body. */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Mock-mode helper used by the demo confirm endpoint. */
export function mockSignature(orderId: string, paymentId: string): string {
  return crypto.createHmac('sha256', 'mock').update(`${orderId}|${paymentId}`).digest('hex');
}
