import rateLimit from 'express-rate-limit';
import { getRateLimitStore } from '../lib/redis.js';

/** Auth endpoints: brute-force protection with distributed Redis counters. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Try again in 15 minutes.' },
  store: getRateLimitStore('rl:auth:'),
});

/** Booking creation: expensive + abuse-prone with distributed Redis counters. */
export const bookingLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many booking attempts. Please wait a moment.' },
  store: getRateLimitStore('rl:booking:'),
});

/** Review submission with distributed Redis counters. */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many reviews submitted. Please wait.' },
  store: getRateLimitStore('rl:review:'),
});
