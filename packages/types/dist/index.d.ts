/**
 * Namma Guruvayoor — shared domain package (API + web + mobile).
 * Single source of truth for enums, constants, the booking state machine,
 * money helpers and zod validators.
 */
export declare const ROLES: readonly ["CUSTOMER", "HOTEL_OWNER", "ADMIN", "SUPER_ADMIN"];
export type Role = (typeof ROLES)[number];
export declare const HOTEL_STATUSES: readonly ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "DEACTIVATED"];
export type HotelStatus = (typeof HOTEL_STATUSES)[number];
/** Statuses in which a hotel is publicly visible AND bookable. */
export declare const PUBLIC_HOTEL_STATUSES: readonly HotelStatus[];
export declare const BOOKING_STATUSES: readonly ["PENDING", "CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
/** Booking statuses that hold inventory. */
export declare const INVENTORY_HOLDING_STATUSES: readonly BookingStatus[];
export declare const PAYMENT_STATUSES: readonly ["INITIATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
/**
 * Allowed transitions. Anything not listed here is rejected at the API layer.
 *   PENDING → CONFIRMED | REJECTED | CANCELLED
 *   CONFIRMED → CANCELLED | COMPLETED | NO_SHOW
 */
export declare const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]>;
export declare function canTransition(from: BookingStatus, to: BookingStatus): boolean;
/** Who may perform a transition. */
export type Actor = 'CUSTOMER' | 'OWNER' | 'ADMIN' | 'SYSTEM';
export declare const TRANSITION_ACTORS: Record<string, readonly Actor[]>;
export declare function canTransitionAs(from: BookingStatus, to: BookingStatus, actor: Actor): boolean;
export declare const PAISE_PER_RUPEE = 100;
export declare function rupeesToPaise(rupees: number): number;
export declare function paiseToRupees(paise: number): number;
export declare function formatINR(paise: number): string;
/**
 * Server-side price calculation. Client-supplied prices are NEVER trusted.
 * GST for hotel rooms ≤ ₹7,500/night is 12%; above that 18% (Indian tax rule).
 */
export declare function calculatePrice(opts: {
    pricePerNightPaise: number;
    nights: number;
    rooms: number;
    taxBps?: number;
}): {
    subtotalPaise: number;
    taxPaise: number;
    totalPaise: number;
};
/** Platform commission split from the subtotal (before tax). */
export declare function splitCommission(subtotalPaise: number, rateBps: number): {
    commissionPaise: number;
    ownerPayoutPaise: number;
};
/** GV-YYYY-XXXXXX — year of creation + 6 cryptographically random digits. */
export declare function generateBookingCode(year?: number): string;
export declare const BOOKING_CODE_RE: RegExp;
export declare const TEMPLE_DISTANCE_BANDS: readonly [{
    readonly key: "u500";
    readonly label: "Under 500 m";
    readonly min: 0;
    readonly max: 500;
}, {
    readonly key: "500to1k";
    readonly label: "500 m – 1 km";
    readonly min: 500;
    readonly max: 1000;
}, {
    readonly key: "1kto2k";
    readonly label: "1 – 2 km";
    readonly min: 1000;
    readonly max: 2000;
}, {
    readonly key: "2kto5k";
    readonly label: "2 – 5 km";
    readonly min: 2000;
    readonly max: 5000;
}];
export type DistanceBandKey = (typeof TEMPLE_DISTANCE_BANDS)[number]['key'];
/** Haversine distance in meters. */
export declare function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number;
/** Walking ≈ 4.5 km/h, driving ≈ 25 km/h in Guruvayoor town conditions. */
export declare function travelEstimate(meters: number): {
    walkMin: number;
    driveMin: number;
};
export declare function distanceLabel(meters: number): string;
/** Nights between two calendar dates (check-out exclusive). */
export declare function nightsBetween(checkIn: Date, checkOut: Date): number;
/** All stay dates [checkIn, checkOut) as YYYY-MM-DD strings. */
export declare function stayDates(checkIn: Date, checkOut: Date): string[];
export declare function slugify(input: string): string;
import { z } from 'zod';
export declare const phoneSchema: z.ZodString;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["CUSTOMER", "HOTEL_OWNER"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "CUSTOMER" | "HOTEL_OWNER";
}, {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: "CUSTOMER" | "HOTEL_OWNER" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    identifier: string;
}, {
    password: string;
    identifier: string;
}>;
export declare const dateStr: z.ZodEffects<z.ZodString, Date, string>;
export declare const createBookingSchema: z.ZodEffects<z.ZodObject<{
    hotelId: z.ZodString;
    roomTypeId: z.ZodString;
    checkIn: z.ZodEffects<z.ZodString, Date, string>;
    checkOut: z.ZodEffects<z.ZodString, Date, string>;
    guests: z.ZodNumber;
    rooms: z.ZodNumber;
    specialRequests: z.ZodOptional<z.ZodString>;
    guest: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        phone: string;
    }, {
        name: string;
        email: string;
        phone: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    rooms: number;
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    specialRequests?: string | undefined;
    guest?: {
        name: string;
        email: string;
        phone: string;
    } | undefined;
}, {
    rooms: number;
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    specialRequests?: string | undefined;
    guest?: {
        name: string;
        email: string;
        phone: string;
    } | undefined;
}>, {
    rooms: number;
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    specialRequests?: string | undefined;
    guest?: {
        name: string;
        email: string;
        phone: string;
    } | undefined;
}, {
    rooms: number;
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    specialRequests?: string | undefined;
    guest?: {
        name: string;
        email: string;
        phone: string;
    } | undefined;
}>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export declare const searchSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    checkIn: z.ZodOptional<z.ZodString>;
    checkOut: z.ZodOptional<z.ZodString>;
    guests: z.ZodOptional<z.ZodNumber>;
    rooms: z.ZodOptional<z.ZodNumber>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    band: z.ZodOptional<z.ZodEnum<["u500", "500to1k", "1kto2k", "2kto5k"]>>;
    minRating: z.ZodOptional<z.ZodNumber>;
    amenities: z.ZodOptional<z.ZodString>;
    ac: z.ZodOptional<z.ZodBoolean>;
    sort: z.ZodDefault<z.ZodEnum<["recommended", "nearest", "price_asc", "price_desc", "rating"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort: "recommended" | "nearest" | "price_asc" | "price_desc" | "rating";
    page: number;
    limit: number;
    rooms?: number | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
    guests?: number | undefined;
    q?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    band?: "u500" | "500to1k" | "1kto2k" | "2kto5k" | undefined;
    minRating?: number | undefined;
    amenities?: string | undefined;
    ac?: boolean | undefined;
}, {
    sort?: "recommended" | "nearest" | "price_asc" | "price_desc" | "rating" | undefined;
    rooms?: number | undefined;
    checkIn?: string | undefined;
    checkOut?: string | undefined;
    guests?: number | undefined;
    q?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    band?: "u500" | "500to1k" | "1kto2k" | "2kto5k" | undefined;
    minRating?: number | undefined;
    amenities?: string | undefined;
    ac?: boolean | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type SearchQuery = z.infer<typeof searchSchema>;
export declare const reviewSchema: z.ZodObject<{
    bookingId: z.ZodString;
    overall: z.ZodNumber;
    cleanliness: z.ZodNumber;
    location: z.ZodNumber;
    staff: z.ZodNumber;
    value: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: number;
    bookingId: string;
    overall: number;
    cleanliness: number;
    location: number;
    staff: number;
    comment?: string | undefined;
}, {
    value: number;
    bookingId: string;
    overall: number;
    cleanliness: number;
    location: number;
    staff: number;
    comment?: string | undefined;
}>;
export declare const GSV_TYPES_VERSION: "1.0.0";
