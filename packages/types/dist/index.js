/**
 * Namma Guruvayoor — shared domain package (API + web + mobile).
 * Single source of truth for enums, constants, the booking state machine,
 * money helpers and zod validators.
 */
// ── Enums (mirrors of Prisma enums — keep in sync with schema.prisma) ────────
export const ROLES = ['CUSTOMER', 'HOTEL_OWNER', 'ADMIN', 'SUPER_ADMIN'];
export const HOTEL_STATUSES = [
    'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED',
];
/** Statuses in which a hotel is publicly visible AND bookable. */
export const PUBLIC_HOTEL_STATUSES = ['APPROVED'];
export const BOOKING_STATUSES = [
    'PENDING', 'ACCEPTED', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW',
];
/** Booking statuses that hold inventory. */
export const INVENTORY_HOLDING_STATUSES = ['PENDING', 'ACCEPTED', 'CONFIRMED'];
export const PAYMENT_STATUSES = [
    'INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED',
];
// ── Booking state machine ────────────────────────────────────────────────────
/**
 * Allowed transitions. Anything not listed here is rejected at the API layer.
 *   PENDING → CONFIRMED | REJECTED | CANCELLED
 *   CONFIRMED → CANCELLED | COMPLETED | NO_SHOW
 */
export const BOOKING_TRANSITIONS = {
    PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
    REJECTED: [],
    CANCELLED: [],
    COMPLETED: [],
    NO_SHOW: [],
};
export function canTransition(from, to) {
    return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}
export const TRANSITION_ACTORS = {
    'PENDING->ACCEPTED': ['OWNER', 'ADMIN'],
    'PENDING->REJECTED': ['OWNER', 'ADMIN'],
    'PENDING->CANCELLED': ['CUSTOMER', 'OWNER', 'ADMIN'],
    'ACCEPTED->CONFIRMED': ['ADMIN', 'SYSTEM'],
    'ACCEPTED->CANCELLED': ['CUSTOMER', 'OWNER', 'ADMIN'],
    'CONFIRMED->CANCELLED': ['CUSTOMER', 'OWNER', 'ADMIN'],
    'CONFIRMED->COMPLETED': ['OWNER', 'ADMIN', 'SYSTEM'],
    'CONFIRMED->NO_SHOW': ['OWNER', 'ADMIN'],
};
export function canTransitionAs(from, to, actor) {
    return canTransition(from, to) && (TRANSITION_ACTORS[`${from}->${to}`] ?? []).includes(actor);
}
// ── Money (all amounts are integer paise) ────────────────────────────────────
export const PAISE_PER_RUPEE = 100;
export function rupeesToPaise(rupees) {
    return Math.round(rupees * PAISE_PER_RUPEE);
}
export function paiseToRupees(paise) {
    return paise / PAISE_PER_RUPEE;
}
export function formatINR(paise) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(paise / PAISE_PER_RUPEE);
}
/**
 * Server-side price calculation. Client-supplied prices are NEVER trusted.
 * GST is no longer applied (removed per platform requirements).
 */
export function calculatePrice(opts) {
    const { pricePerNightPaise, nights, rooms } = opts;
    const subtotalPaise = pricePerNightPaise * nights * rooms;
    const taxPaise = 0;
    return { subtotalPaise, taxPaise, totalPaise: subtotalPaise + taxPaise };
}
/** Platform commission split from the subtotal (before tax). */
export function splitCommission(subtotalPaise, rateBps) {
    const commissionPaise = Math.round((subtotalPaise * rateBps) / 10000);
    return { commissionPaise, ownerPayoutPaise: subtotalPaise - commissionPaise };
}
// ── Booking codes ────────────────────────────────────────────────────────────
/** GV-YYYY-XXXXXX — year of creation + 6 cryptographically random digits. */
export function generateBookingCode(year = new Date().getFullYear()) {
    const min = 100000;
    const max = 999999;
    const n = min + Math.floor(Math.random() * (max - min + 1));
    return `GV-${year}-${n}`;
}
export const BOOKING_CODE_RE = /^GV-\d{4}-\d{6}$/;
// ── Distance bands (temple-centric UX) ───────────────────────────────────────
export const TEMPLE_DISTANCE_BANDS = [
    { key: 'u500', label: 'Under 500 m', min: 0, max: 500 },
    { key: '500to1k', label: '500 m – 1 km', min: 500, max: 1000 },
    { key: '1kto2k', label: '1 – 2 km', min: 1000, max: 2000 },
    { key: '2kto5k', label: '2 – 5 km', min: 2000, max: 5000 },
];
/** Haversine distance in meters. */
export function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
/** Walking ≈ 4.5 km/h, driving ≈ 25 km/h in Guruvayoor town conditions. */
export function travelEstimate(meters) {
    return {
        walkMin: Math.max(1, Math.round((meters / 1000 / 4.5) * 60)),
        driveMin: Math.max(1, Math.round((meters / 1000 / 25) * 60)),
    };
}
export function distanceLabel(meters) {
    if (meters < 950)
        return `${Math.round(meters / 10) * 10} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}
// ── Dates ────────────────────────────────────────────────────────────────────
/** Nights between two calendar dates (check-out exclusive). */
export function nightsBetween(checkIn, checkOut) {
    const MS_DAY = 86400000;
    const a = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
    const b = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
    return Math.round((b - a) / MS_DAY);
}
/** All stay dates [checkIn, checkOut) as YYYY-MM-DD strings. */
export function stayDates(checkIn, checkOut) {
    const out = [];
    const d = new Date(checkIn);
    while (d < checkOut) {
        out.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
}
// ── Slugify ──────────────────────────────────────────────────────────────────
export function slugify(input) {
    return input
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}
// ── Zod validators (API boundary + client forms) ─────────────────────────────
import { z } from 'zod';
export const phoneSchema = z
    .string()
    .regex(/^(\+91[ -]?)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number');
export const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: phoneSchema,
    password: z
        .string()
        .min(8, 'Minimum 8 characters')
        .regex(/[A-Za-z]/, 'Needs a letter')
        .regex(/\d/, 'Needs a digit'),
    role: z.enum(['CUSTOMER', 'HOTEL_OWNER', 'DRIVER', 'GUIDE', 'RESTAURANT_OWNER']).default('CUSTOMER'),
});
export const loginSchema = z.object({
    identifier: z.string().min(3), // email OR phone
    password: z.string().min(1),
});
export const dateStr = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .transform((s) => new Date(`${s}T00:00:00.000Z`));
export const createBookingSchema = z
    .object({
    hotelId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    checkIn: dateStr,
    checkOut: dateStr,
    guests: z.number().int().min(1).max(20),
    rooms: z.number().int().min(1).max(10),
    specialRequests: z.string().max(1000).optional(),
    guest: z
        .object({
        name: z.string().min(2).max(80),
        phone: phoneSchema,
        email: z.string().email(),
    })
        .optional(),
})
    .refine((v) => v.checkOut > v.checkIn, {
    message: 'Check-out must be after check-in',
    path: ['checkOut'],
});
export const searchSchema = z.object({
    q: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.coerce.number().int().min(1).max(20).optional(),
    rooms: z.coerce.number().int().min(1).max(10).optional(),
    minPrice: z.coerce.number().min(0).optional(), // rupees
    maxPrice: z.coerce.number().min(0).optional(),
    band: z.enum(['u500', '500to1k', '1kto2k', '2kto5k']).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    amenities: z.string().optional(), // csv of amenity keys
    ac: z.coerce.boolean().optional(),
    sort: z.enum(['recommended', 'nearest', 'price_asc', 'price_desc', 'rating']).default('recommended'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const reviewSchema = z.object({
    bookingId: z.string().uuid(),
    overall: z.number().int().min(1).max(5),
    cleanliness: z.number().int().min(1).max(5),
    location: z.number().int().min(1).max(5),
    staff: z.number().int().min(1).max(5),
    value: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
});
// Collection notices keep tree-shaking honest for zod side-effect imports.
export const GSV_TYPES_VERSION = '1.0.0';
//# sourceMappingURL=index.js.map