# Namma Guruvayoor — REST API Reference

Base URL (dev): `http://localhost:4000` · Interactive overview: `GET /docs` · Health: `GET /health`

All responses are JSON. Errors use a machine-readable `error` code, human `message`, and never leak stack traces.

## Authentication

- `POST /api/auth/register` — `{ name, email, phone, password, role: CUSTOMER|HOTEL_OWNER }` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/login` — `{ identifier (email or phone), password }` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — `{ refreshToken }` → rotated `{ accessToken, refreshToken }`.
  Refresh tokens are **single-use**; reuse triggers a family-wide revocation.
- `POST /api/auth/logout` 🔒 — revokes all sessions for the user.
- `GET /api/auth/me` 🔒

`🔒` = requires `Authorization: Bearer <accessToken>` (15-minute TTL).

## Hotels (public)

| Endpoint | Description |
| --- | --- |
| `GET /api/hotels` | Search. Query: `q, checkIn, checkOut, guests, rooms, minPrice, maxPrice, band (u500\|500to1k\|1kto2k\|2kto5k), minRating, amenities (csv), ac, sort (recommended\|nearest\|price_asc\|price_desc\|rating), page, limit` |
| `GET /api/hotels/meta/filters` | Amenity catalog + distance bands |
| `GET /api/hotels/:slug` | Full detail incl. per-room live `availableNow` |

Only hotels in `APPROVED` status are ever returned by public endpoints.

## Booking

| Endpoint | Description |
| --- | --- |
| `POST /api/bookings` | Create booking. Works **logged-in or guest** (guest requires `{ guest: { name, phone, email } }`). Server computes nights, price, GST, commission. Availability is validated inside a transaction guarded by `pg_advisory_xact_lock(roomTypeId)`. |
| `GET /api/bookings/mine` 🔒 | Customer's bookings |
| `GET /api/bookings/track?code=GV-…&contact=phone\|email` | Guest booking lookup |
| `GET /api/bookings/:id` 🔒 | Detail — customer, hotel owner, or admin |
| `POST /api/bookings/:id/transition` 🔒 | `{ action: CONFIRM\|REJECT\|CANCEL\|COMPLETE\|NO_SHOW, reason? }`. State machine + actor permissions enforced; invalid transitions → `409 INVALID_TRANSITION`. |

Booking codes: `GV-YYYY-XXXXXX`. Inventory holds derive from bookings in `PENDING/CONFIRMED`;
cancel/reject automatically releases the rooms (no counter to drift).

## Payments

| Endpoint | Description |
| --- | --- |
| `POST /api/payments/create` 🔒 | `{ bookingId }` → gateway order. Amount always read from the DB. |
| `POST /api/payments/confirm` 🔒 | Razorpay checkout signature verification → `CAPTURED` + booking auto-`CONFIRMED`. |
| `POST /api/payments/webhook` | Razorpay webhook. Raw-body HMAC-SHA256 via `X-Razorpay-Signature`. Handles `payment.captured`, `payment.failed`, `refund.processed`. Idempotent. |
| `POST /api/payments/refund` 🔒 admin | `{ bookingId, amountPaise?, reason? }` → refund + audit + customer notification. |

Without Razorpay keys the API runs in **mock mode** (`PAYMENT_MOCK=1`) so the full
book → pay → confirm loop works locally.

## Hotel owner

| Endpoint | Description |
| --- | --- |
| `GET /api/owner/dashboard` 🔒 | Today's bookings, check-ins/outs, pending, revenue, rooms |
| `GET /api/owner/bookings?status=` 🔒 | Booking table with customer contact details |
| `PATCH /api/owner/bookings/:id` 🔒 | `{ action: CONFIRM\|REJECT\|CANCEL, reason? }` |
| `GET /api/owner/hotels` 🔒 | Own properties |
| `POST /api/hotels/register` 🔒 | 10-step wizard payload → `PENDING` hotel. |
| `PATCH /api/owner/rooms/:id` 🔒 | Room price, inventory (`totalRooms`, `blockedRooms`), details |
| `POST /api/owner/hotels/:hotelId/rooms` 🔒 | Add room category |
| `GET /api/owner/availability?hotelId&month=YYYY-MM` 🔒 | Day × room availability matrix |
| `PATCH /api/owner/hotels/:id/profile` 🔒 | Cosmetic profile edits |
| `GET /api/owner/reviews` · `POST /api/owner/reviews/:id/response` 🔒 | Reviews + public response |

## Admin (ADMIN / SUPER_ADMIN only)

| Endpoint | Description |
| --- | --- |
| `GET /api/admin/stats` | Platform KPIs |
| `GET /api/admin/hotels?status=&q=&page=` | Verification queues and lists |
| `GET /api/admin/hotels/:id` | Full application (docs, location, rooms) |
| `PATCH /api/admin/hotels/:id` | `{ action: UNDER_REVIEW\|APPROVE\|REJECT\|REQUEST_CHANGES\|SUSPEND\|DEACTIVATE\|REACTIVATE, reason?, edits? }` |
| `GET /api/admin/bookings?status=&code=&customer=&hotelId=` | Every booking |
| `GET /api/admin/users?role=&q=` · `PATCH /api/admin/users/:id/block` | Directory + block |
| `GET/PATCH /api/admin/settings` | Commission bps, booking fee, distances, branding |
| `GET /api/admin/reviews` · `PATCH /api/admin/reviews/:id` | Moderation |
| `GET /api/admin/audit` | Immutable action log |

## Reviews & misc

| Endpoint | Description |
| --- | --- |
| `POST /api/reviews` 🔒 | One review per **COMPLETED** booking; recomputes hotel aggregates. |
| `GET /api/reviews/hotel/:hotelId` | Published reviews |
| `GET/POST/DELETE /api/me/favorites…` 🔒 | Saved hotels |
| `GET /api/me/notifications` · `POST /api/me/notifications/read` 🔒 | Notification center |
| `POST /api/me/devices` 🔒 | Register FCM/Expo push token |

## Rate limits

- Global: 300 req/min/IP
- Auth endpoints: 20 req / 15 min
- Booking creation: 10 req/min
- Reviews: 10 req/hour

## Error codes

`VALIDATION_ERROR` · `UNAUTHORIZED` · `TOKEN_INVALID` · `REFRESH_REUSED` · `FORBIDDEN` ·
`NOT_FOUND` · `HOTEL_NOT_BOOKABLE` · `ROOM_NOT_FOUND` · `OUT_OF_STOCK` · `CAPACITY_EXCEEDED` ·
`INVALID_TRANSITION` · `GUEST_DETAILS_REQUIRED` · `BOOKING_NOT_COMPLETED` · `REVIEW_EXISTS` ·
`SIGNATURE_INVALID` · `WEBHOOK_SIGNATURE_INVALID` · `DUPLICATE` · `TOO_MANY_REQUESTS` · `INTERNAL`
