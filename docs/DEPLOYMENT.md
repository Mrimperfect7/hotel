# Deployment Guide

## Architecture

| Component | Service | Notes |
| --- | --- | --- |
| Web (customer + owner + admin) | **Vercel** | Next.js 14, `apps/web` |
| REST API | **Railway / Render / Fly.io** | Node 20+, `apps/api` (Dockerfile provided) |
| Database | **Railway / Neon / Supabase / RDS** | PostgreSQL 16, connection pooling (PgBouncer or provider pooler) |
| Images | **Cloudinary** (prod) / local disk (dev) | `CLOUDINARY_URL` |
| Payments | **Razorpay** | Keys + webhook secret required for live mode |
| Push | **FCM / Expo Notifications** | Server registers device tokens (`/api/me/devices`) |
| Email/SMS/WhatsApp | Resend / provider adapters | Console adapters active until keys set |
| Mobile | **EAS Build** → Play Store / TestFlight | `apps/mobile` |

## 1. Database

```bash
# Against your managed instance
DATABASE_URL="postgresql://user:pass@host:5432/guruvayoor_stay?schema=public&sslmode=require" \
  npm run db:push -w @gsv/database
```

Do **not** run the demo seed in production. Create the first admin instead:

```bash
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD='a-long-random-password' \
  npm run admin:create -w @gsv/database
```

## 2. API (Railway example)

1. New service → deploy from repo, root `/`, Dockerfile `apps/api/Dockerfile`.
2. Environment: all vars from `.env.example` — **generate fresh 48-byte** `JWT_SECRET`
   and `REFRESH_TOKEN_SECRET` (`openssl rand -base64 48`). Set `PAYMENT_MOCK=0` once
   Razorpay keys are real. `WEB_ORIGIN=https://yourdomain.com`.
3. Health check: `GET /health`.
4. Razorpay dashboard → Webhooks → add `https://api.yourdomain.com/api/payments/webhook`,
   events: `payment.captured`, `payment.failed`, `refund.processed`, secret = `RAZORPAY_WEBHOOK_SECRET`.

## 3. Web (Vercel)

- Root directory: `apps/web`.
- Env: `NEXT_PUBLIC_API_ORIGIN=https://api.yourdomain.com`,
  `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`,
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if using JS maps beyond the embed).
- `robots.ts` disallows `/admin`, `/owner`, `/api`, `/booking`.

## 4. Mobile (EAS)

```bash
cd apps/mobile
npx eas build:configure
eas build -p android --profile production
```

Set the production `extra.apiOrigin` in `app.json` before building.
Push delivery: Expo Notifications → FCM credentials in Expo dashboard; device
tokens reach the API via `POST /api/me/devices`.

## 5. Go-live checklist

- [ ] Fresh `JWT_SECRET` / `REFRESH_TOKEN_SECRET` (never the dev values)
- [ ] `PAYMENT_MOCK=0`, real Razorpay keys, webhook secret registered + verified with a ₹1 live test
- [ ] First admin created via `admin:create`, dev demo accounts absent
- [ ] CORS `WEB_ORIGIN` matches the real domain
- [ ] Managed Postgres with TLS (`sslmode=require`) + automated backups
- [ ] Log drain (Railway/Render logs → Datadog/Loki) — API logs `[api] unhandled` lines
- [ ] `robots.txt` + `sitemap.xml` reachable; hotel schema.org data validated in Rich Results test
- [ ] Rate limits reviewed (auth 20/15min, bookings 10/min, global 300/min)

## Scaling notes (future)

The schema is hotel-centric but city-agnostic: add a `City` dimension or a
`Hotel.city` slug before launching a second town. Verticals (homestays, resorts,
packages) can subclass via `Hotel.propertyKind` without touching the booking
engine, which only depends on `RoomType` + date-range holds.
