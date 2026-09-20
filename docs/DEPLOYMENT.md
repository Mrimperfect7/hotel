# Deployment Guide

## Fast path — $0 public deployment (Windows, no Docker needed)

Goal: an API on the public internet so the installed APK works from **any
network**, for any number of users.

### 1. Permanent free database (Neon)

1. Sign up at **https://neon.tech** (free, no expiry on the free tier).
2. Create project "namma-guruvayoor" → copy the **connection string**
   (`postgresql://…neon.tech/neondb?sslmode=require`).

### 1b. Neon pooled vs direct connection strings

Neon gives you two strings — use each for the right job:

- **Pooled** (host contains `-pooler`): for the deployed API's `DATABASE_URL`.
  **Append `&pgbouncer=true`** so Prisma disables prepared statements
  (PgBouncer transaction mode does not support them):
  `postgresql://…-pooler….neon.tech/neondb?sslmode=require&pgbouncer=true`
- **Direct** (no `-pooler`): for schema work from your PC — `db:push`,
  `admin:create`, migrations. Prisma must not go through the pooler here.

### 2. Public API (Render)

1. Push this repo to GitHub (done), sign up at **https://render.com**.
2. **New → Blueprint** → select the repo → Render reads `render.yaml`.
3. When prompted, paste the **Neon connection string** as `DATABASE_URL`.
4. Deploy (~5 min). Note your URL, e.g. `https://namma-guruvayoor-api.onrender.com`.
   Free tier sleeps after ~15 min idle; first request then takes ~30–60s
   (upgrade to the $7/mo plan for always-on).
5. Test: open `<your-url>/health` in a browser → `{"ok":true,…}`.

### 3. Create the cloud schema + first admin (run from your PC)

```bat
set DATABASE_URL=<paste your Neon connection string>
npm run db:push -w @gsv/database
set ADMIN_EMAIL=admin@yourdomain.com& set ADMIN_PASSWORD=choose-a-long-password
npm run admin:create -w @gsv/database
```

(Do **not** run the demo seed on the production database.)

### 4. Rebuild the APK for the world

Edit `FALLBACK_API_ORIGIN` in `apps/mobile/app.config.js` to the Render URL,
commit, then in your terminal:

```bat
cd C:\hotel\apps\mobile
npx eas build -p android --profile preview
```

Every user on any Wi-Fi/cellular network can now install and use the app.
Share the APK link directly (installers just accept "install unknown apps"
once), or publish to the Play Store (below).

### 5. Publish the web app too (optional but recommended)

Vercel: import the repo, root directory `apps/web`, env
`NEXT_PUBLIC_API_ORIGIN=https://<your-render-url>`. Then set Render's
`WEB_ORIGIN` to the Vercel URL so CORS accepts it, and redeploy.

### 6. Play Store (later, $25 one-time)

1. Google Play Console account → create app.
2. Build an AAB: `npx eas build -p android --profile production`.
3. Store listing needs: privacy policy URL (host the web app first — `/privacy`
   exists), content rating, screenshots. EAS manages app signing.

---

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
