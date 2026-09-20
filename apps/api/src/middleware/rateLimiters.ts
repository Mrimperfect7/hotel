import rateLimit from 'express-rate-limit';

/** Auth endpoints: brute-force protection. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Try again in 15 minutes.' },
});

/** Booking creation: expensive + abuse-prone. */
export const bookingLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many booking attempts. Please wait a moment.' },
});

/** Review submission. */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many reviews submitted. Please wait.' },
});
