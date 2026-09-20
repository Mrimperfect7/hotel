# Database Design — Namma Guruvayoor

PostgreSQL 16 via Prisma ORM. Schema: [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma).

## Conventions

- **UUID primary keys**, `createdAt`/`updatedAt` on every entity.
- **Money is integer paise** (₹1 = 100). No floats ever touch money.
- **Stay dates** are `@db.Date` (calendar days, timezone-safe).
- **Soft deletion** (`deletedAt`) on User, Hotel, RoomType.
- **Indexes** on every foreign key plus search columns (`status`, `minPricePaise`, `ratingAvg`, `bookingCode`…).

## Entity map

```
User ─┬─ Customer (profile)
      ├─ HotelOwner ──< Hotel ─┬─< HotelImage
      ├─ RefreshToken          ├─< HotelDocument
      ├─ DeviceToken           ├──< HotelAmenity >── Amenity
      ├─ Notification          ├─< RoomType ─┬─< RoomAmenity >── Amenity
      ├─ Favorite ─> Hotel     │             └─< BookingRoom >── Booking
      ├─ Review                ├─< Booking ──< Payment
      └─ AuditLog (actor)      └─< Review >── Booking (1:1, COMPLETED only)
Commission (DEFAULT | HOTEL | PROMO)
PlatformSetting (JSON config, admin-editable)
```

## Inventory & double-booking invariants

1. `RoomType.totalRooms` = physical rooms; `blockedRooms` = out-of-service.
   Sellable = `totalRooms - blockedRooms`.
2. **Holds are derived, not stored**: rooms held for a date range = sum of
   `BookingRoom.roomsCount` whose booking status ∈ {`PENDING`, `CONFIRMED`} and whose
   `[checkIn, checkOut)` overlaps the night. There is no separate counter to drift.
3. Booking creation runs inside a transaction that first takes
   `pg_advisory_xact_lock(hashtext(roomTypeId))` — a per-room-type serialization
   point. Availability is **re-read after the lock**, then the booking row is
   inserted. Two racing requests can never both pass the check; the loser gets
   a clean `409 OUT_OF_STOCK`.
4. Cancels/rejects move the booking out of the holding set → rooms return to
   inventory atomically with the status change.

## Booking state machine

```
PENDING ──→ CONFIRMED ──→ COMPLETED
   │ │ └──→ CANCELLED (customer/owner/admin)
   │ └──→ REJECTED (owner/admin)
   └──→ CANCELLED
CONFIRMED ──→ CANCELLED | COMPLETED | NO_SHOW
```

Transitions are enforced in `packages/types` (`BOOKING_TRANSITIONS`,
`TRANSITION_ACTORS`) and re-checked server-side on every mutation. Terminal
states (`REJECTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`) have no outgoing edges.

## Payments

`Payment.status`: `INITIATED → AUTHORIZED → CAPTURED → (REFUNDED | PARTIALLY_REFUNDED)` or `FAILED`.
Gateway ids (`providerOrderId`, `providerPaymentId`) are unique-indexed; raw card
data never reaches the system (Razorpay checkout + webhook HMAC only).

## Audit log

`AuditLog` records actor, role, action (`HOTEL_APPROVED`, `BOOKING_CANCELLED`,
`REFUND_ISSUED`, `USER_BLOCKED`, `SETTINGS_UPDATED`, …), entity, entity id, IP,
and JSON metadata. Write failures are logged loudly but never block the primary
operation; rows are never updated or deleted.

## Commission

Stored in basis points: default 10% = `1000`. Resolution order for a booking:
`Hotel.commissionBps` override → active `Commission` row (HOTEL/PROMO scope) →
`PlatformSetting.commissionBps`. Split is computed at booking time and frozen on
the booking row (`commissionPaise`, `ownerPayoutPaise`).
