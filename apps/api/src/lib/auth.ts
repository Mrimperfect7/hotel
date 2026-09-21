import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { prisma } from '@gsv/database';
import { config } from '@gsv/config';
import { ApiError } from './errors.js';

const BCRYPT_ROUNDS = 12;

import type { Role } from '@prisma/client';

export type AuthUser = {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
};

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone },
    config.jwtSecret,
    { expiresIn: config.jwtAccessTtl, issuer: 'namma-guruvayoor', audience: 'gsv-clients' } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.jwtSecret, {
    issuer: 'namma-guruvayoor',
    audience: 'gsv-clients',
  }) as { sub: string; role: AuthUser['role']; name: string; email: string | null; phone: string | null };
  return { id: payload.sub, role: payload.role, name: payload.name, email: payload.email, phone: payload.phone };
}

// ── Refresh tokens: opaque, hashed at rest, single-use with rotation ─────────

export type RefreshTokenRow = {
  id: string;
  userId: string;
  expiresAt: Date;
};

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function issueRefreshToken(userId: string, device: string | undefined, ip: string | undefined): Promise<string> {
  const raw = crypto.randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(raw),
      device: device?.slice(0, 120),
      ip: ip?.slice(0, 60),
      expiresAt: new Date(Date.now() + config.refreshTtlDays * 86400000),
    },
  });
  return raw;
}

/** Validates + rotates. Throws ApiError.unauthorized on bad/expired/reused tokens. */
export async function rotateRefreshToken(oldRaw: string, device?: string, ip?: string): Promise<{ userId: string; raw: string }> {
  const hash = sha256(oldRaw);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!row) throw ApiError.unauthorized('Invalid refresh token', 'REFRESH_INVALID');
  if (row.revokedAt) {
    // Reuse detected → revoke the whole family for this user (defensive kill-switch).
    await prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Session expired, please log in again', 'REFRESH_REUSED');
  }
  if (row.expiresAt.getTime() < Date.now()) throw ApiError.unauthorized('Session expired', 'REFRESH_EXPIRED');

  const raw = await issueRefreshToken(row.userId, device, ip);
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date(), replacedBy: raw.slice(0, 12) },
  });
  return { userId: row.userId, raw };
}

export async function revokeAllForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

// ── Session cookies (web) ────────────────────────────────────────────────────

export function setRefreshCookie(res: Response, raw: string): void {
  res.cookie('gsv_rt', raw, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: config.refreshTtlDays * 86400000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.cookie('gsv_rt', '', {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 0,
  });
}
