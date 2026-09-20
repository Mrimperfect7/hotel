import express from 'express';
import path from 'node:path';
// Load repo-root .env for compiled (node dist) runs; tsx dev loads it via @gsv/config too.
import '@gsv/config';
import { buildApp } from './app.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { authRouter } from './routes/auth.js';
import { hotelsRouter } from './routes/hotels.js';
import { bookingsRouter } from './routes/bookings.js';
import { paymentsRouter } from './routes/payments.js';
import { ownerRouter } from './routes/owner.js';
import { adminRouter } from './routes/admin.js';
import { reviewsRouter, miscRouter } from './routes/reviews.js';

const app = buildApp();

// Razorpay webhook needs the RAW body for HMAC verification — must be mounted
// BEFORE any JSON body parser touches this path.
app.post('/api/payments/webhook', express.raw({ type: '*/*', limit: '256kb' }), (req, _res, next) => {
  // Re-expose raw body for the router below (payments router reads req.body).
  (req as unknown as { rawBody?: Buffer }).rawBody = req.body as Buffer;
  next();
});

// Payments router (webhook route inside reads raw buffer when available).
app.use('/api/payments', paymentsRouter);

// JSON APIs.
app.use('/api/auth', authRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/me', miscRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/admin', adminRouter);

// Uploaded images (dev local storage; prod uses Cloudinary CDN).
app.use('/uploads', express.static(path.resolve('uploads'), { fallthrough: true, maxAge: '7d' }));

// Root landing redirects to docs.
app.get('/', (_req, res) => {
  res.redirect('/docs');
});

// Lightweight API docs page.
app.get('/docs', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><title>Namma Guruvayoor API</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:ui-sans-serif,system-ui;max-width:860px;margin:40px auto;padding:0 16px;color:#1e2340}
h1{color:#1e3a6e}code{background:#f1ecdf;padding:2px 6px;border-radius:4px}
li{margin:6px 0}details{margin:8px 0}summary{cursor:pointer;font-weight:600}</style></head>
<body>
<h1>🙏 Namma Guruvayoor — API</h1>
<p>REST API for the hotel marketplace near Guruvayoor Sri Krishna Temple.</p>
<details open><summary>Auth</summary>
<ul>
<li><code>POST /api/auth/register</code> — {name,email,phone,password,role:CUSTOMER|HOTEL_OWNER}</li>
<li><code>POST /api/auth/login</code> — {identifier,password}</li>
<li><code>POST /api/auth/refresh</code> — rotate refresh token</li>
<li><code>POST /api/auth/logout</code> 🔒</li>
<li><code>GET /api/auth/me</code> 🔒</li>
</ul></details>
<details><summary>Hotels (public)</summary>
<ul>
<li><code>GET /api/hotels?q&band&minPrice&maxPrice&minRating&amenities&ac&sort&page</code></li>
<li><code>GET /api/hotels/meta/filters</code></li>
<li><code>GET /api/hotels/:slug</code></li>
</ul></details>
<details><summary>Bookings</summary>
<ul>
<li><code>POST /api/bookings</code> — create (guest allowed; server-side price+inventory)</li>
<li><code>GET /api/bookings/mine</code> 🔒</li>
<li><code>GET /api/bookings/track?code=GV-…&contact=phone|email</code></li>
<li><code>GET /api/bookings/:id</code> 🔒</li>
<li><code>POST /api/bookings/:id/transition</code> 🔒 — {action:CONFIRM|REJECT|CANCEL|COMPLETE|NO_SHOW}</li>
</ul></details>
<details><summary>Payments</summary>
<ul>
<li><code>POST /api/payments/create</code> 🔒</li>
<li><code>POST /api/payments/confirm</code> 🔒</li>
<li><code>POST /api/payments/webhook</code> — Razorpay (raw-body HMAC)</li>
<li><code>POST /api/payments/refund</code> 🔒 admin</li>
</ul></details>
<details><summary>Owner</summary>
<ul>
<li><code>GET /api/owner/dashboard|bookings|hotels|availability|reviews</code> 🔒</li>
<li><code>PATCH /api/owner/bookings/:id</code>, <code>PATCH /api/owner/rooms/:id</code> 🔒</li>
<li><code>POST /api/hotels/register</code> 🔒 — 10-step wizard</li>
</ul></details>
<details><summary>Admin</summary>
<ul>
<li><code>GET /api/admin/stats|hotels|bookings|users|reviews|audit|settings</code> 🔒</li>
<li><code>PATCH /api/admin/hotels/:id</code> — verify/approve/reject/suspend</li>
<li><code>PATCH /api/admin/users/:id/block</code>, <code>PATCH /api/admin/settings</code></li>
</ul></details>
<details><summary>Reviews & misc</summary>
<ul>
<li><code>POST /api/reviews</code> 🔒 — completed bookings only</li>
<li><code>GET /api/reviews/hotel/:hotelId</code></li>
<li><code>GET/POST/DELETE /api/me/favorites…</code> 🔒</li>
<li><code>GET /api/me/notifications</code>, <code>POST /api/me/notifications/read</code> 🔒</li>
<li><code>POST /api/me/devices</code> 🔒 — FCM push token</li>
</ul></details>
<p style="color:#8a7f63">🔒 = Authorization: Bearer &lt;accessToken&gt; · Health: <code>GET /health</code></p>
</body></html>`);
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'namma-guruvayoor-api', time: new Date().toISOString() }));

app.use(notFoundHandler);
app.use(errorHandler);

// Treat PORT=0 as unset (some CI/shell environments export a zero default).
const rawPort = Number(process.env.PORT ?? 4000);
const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🛕 Namma Guruvayoor API ready on :${PORT} — docs at /docs`);
  });
}

export { app };
export default app;
