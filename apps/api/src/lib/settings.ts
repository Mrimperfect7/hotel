import { prisma } from '@gsv/database';

export type PlatformSettings = {
  platformName: string;
  commissionBps: number; // basis points: 1000 = 10%
  bookingFeePaise: number;
  taxBps: number;
  maxHotelDistanceMeters: number;
  featuredHotelIds: string[];
};

const DEFAULTS: PlatformSettings = {
  platformName: 'Namma Guruvayoor',
  commissionBps: 1000,
  bookingFeePaise: 0,
  taxBps: 1200,
  maxHotelDistanceMeters: 5000,
  featuredHotelIds: [],
};

const KEY = 'platform';

export async function getSettings(): Promise<PlatformSettings> {
  const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULTS;
  return { ...DEFAULTS, ...(row.value as Partial<PlatformSettings>) };
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.platformSetting.upsert({
    where: { key: KEY },
    update: { value: next as unknown as object },
    create: { key: KEY, value: next as unknown as object },
  });
  return next;
}

/** Effective commission for a booking: hotel override > platform default. */
export async function effectiveCommissionBps(hotelCommissionBps: number | null): Promise<number> {
  if (hotelCommissionBps != null) return hotelCommissionBps;
  const s = await getSettings();
  return s.commissionBps;
}
