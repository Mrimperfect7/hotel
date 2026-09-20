# Namma Guruvayoor — monorepo

Production-grade hotel booking platform **exclusively for accommodations near
Guruvayoor Sri Krishna Temple, Kerala**. Pilgrims, tourists and families search,
compare and book verified hotels; hotel owners manage inventory in real time;
admins verify properties and run the platform.

```
apps/
  web/      Next.js 15 (customer site + owner dashboard + admin panel)
  api/      Express + TypeScript REST API (booking engine, payments, RBAC)
  mobile/   Expo Router customer app (Android/iOS)
packages/
  database/ Prisma schema, migrations, client singleton, seed data
  types/    Shared domain types, zod validators, state machine, pricing
  ui/       Shared React UI primitives + design tokens
  config/   Shared lint/env/TS presets
docs/       API reference, DB schema, deployment, onboarding guides
scripts/    dev-db.mjs (zero-docker embedded Postgres for local dev)
```

## Quickstart (local dev, no Docker required)

```bash
npm install
cp .env.example .env            # dev defaults work out of the box

npm run dev:db                  # boots an embedded PostgreSQL 16 on :5433
npm run db:push                 # create schema
npm run db:seed                 # DEMO data: 10 hotels, rooms, bookings, users

npm run dev:api                 # http://localhost:4000  (docs at /docs)
npm run dev:web                 # http://localhost:3000
npm run dev:mobile              # Expo dev server
```

Payments run in **mock mode** until Razorpay keys are set (`PAYMENT_MOCK=1`).
Email/SMS/WhatsApp senders log to console until providers are configured.

## Mobile app (Expo)

The customer app (`apps/mobile`) is a full Expo Router app: Home, Explore
(distance bands, sort, budget filter), hotel detail with photo gallery,
amenities and rooms, guest **or** signed-in checkout, My Bookings with
**guest tracking** (booking ID + phone/email), Saved hotels, and
Profile/login with secure token storage (expo-secure-store) and automatic
access-token refresh.

Run it against your local API:

```bash
npm run dev:mobile        # starts Expo — scan the QR with Expo Go (iOS/Android)
```

The API origin defaults to `http://localhost:4000` (see `app.json → extra.apiOrigin`).
For a physical device, point it at your machine's LAN IP.

```bash
npx expo export --platform android      # verify a production Hermes bundle
eas build -p android --profile preview  # store-ready APK (needs Expo account)
```

## Demo accounts (from `.env`, seeded only in development)

| Role        | Email                          | Password      |
| ----------- | ------------------------------ | ------------- |
| Admin       | `admin@nammaguruvayoor.test`    | `Admin@12345` |
| Owner       | `owner@sreekrishna.test`       | `Owner@123`   |
| Customer    | `arjun@example.test`           | `Customer@123`|

> Never use these in production. Create the super admin with
> `npm run admin:create -w @gsv/database` and rotate all secrets.

## Documentation

- [`docs/API.md`](docs/API.md) — REST API reference
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema & inventory/booking invariants
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Railway/Render + Postgres
- [`docs/ADMIN_SETUP.md`](docs/ADMIN_SETUP.md) — bootstrapping admins safely
- [`docs/OWNER_ONBOARDING.md`](docs/OWNER_ONBOARDING.md) — hotel partner guide

## Non-negotiables

- Availability is validated **server-side inside a serializable transaction**;
  the client can never create inventory.
- Prices are computed **server-side** from the DB, never trusted from the client.
- Payment success is confirmed **only** via verified Razorpay webhook / API
  signature check — never from the browser redirect alone.
- Every admin mutation lands in the immutable `AuditLog`.
