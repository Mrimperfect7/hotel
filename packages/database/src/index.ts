export { prisma } from './client.js';
export type {
  Prisma,
  User, Customer, HotelOwner,
  Hotel, HotelImage, HotelDocument, HotelStatus,
  RoomType, Booking, BookingRoom, Payment, PaymentStatus,
  Commission, Review, Notification, NotificationType,
  Favorite, AuditLog, PlatformSetting, Amenity,
  RefundPolicy, Role, BookingStatus,
} from '@prisma/client';
