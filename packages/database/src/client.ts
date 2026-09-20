import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance; survives Next.js hot reload without leaking
// connections. QUERY/ERROR logging in dev for easier debugging.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
