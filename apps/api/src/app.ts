import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { config } from '@gsv/config';

export function buildApp() {
  const app = express();

  // Behind Vercel/Render/Railway proxies.
  app.set('trust proxy', 1);

  // Security headers.
  app.use(helmet());

  // CORS allow-list (web + mobile can't send cookies; bearer tokens only).
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // curl / mobile webviews
        // WEB_ORIGIN may be a comma-separated allow-list (web, admin, preview…).
        const allowedOrigins = config.webOrigin.split(',').map((o) => o.trim());
        if (allowedOrigins.includes(origin) || origin.startsWith('exp://')) return cb(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: false,
    })
  );

  // HTTP Parameter Pollution guards.
  app.use(hpp());

  // JSON bodies (webhook route needs raw body — mounted in routes before this? no:
  // Razorpay signature is computed over the raw bytes, so we mount the webhook
  // router with express.raw BEFORE this json parser in index.ts).
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Gentle global limiter; stricter per-route limits are applied on auth/booking.
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'TOO_MANY_REQUESTS', message: 'Too many requests, slow down.' },
    })
  );

  return app;
}
