import { Router } from 'express';
import { prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import {
  hashPassword, verifyPassword, signAccessToken,
  issueRefreshToken, rotateRefreshToken, revokeAllForUser,
} from '../lib/auth.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { registerSchema, loginSchema } from '@gsv/types';

export const authRouter = Router();

function clientMeta(req: { headers: Record<string, unknown>; ip?: string }) {
  return {
    device: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    ip: req.ip,
  };
}

/**
 * POST /api/auth/register
 * Roles: CUSTOMER or HOTEL_OWNER (owner gets an empty profile; hotels are
 * registered separately through the 10-step wizard).
 */
authRouter.post(
  '/register',
  authLimiter,
  asyncH(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email.toLowerCase() }, { phone: body.phone }] },
    });
    if (existing) throw ApiError.conflict('An account with this email or phone already exists');

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        customerProfile: body.role === 'CUSTOMER' ? { create: {} } : undefined,
        ownerProfile: body.role === 'HOTEL_OWNER'
          ? { create: { ownerName: body.name, phone: body.phone, email: body.email.toLowerCase() } }
          : undefined,
      },
    });

    const accessToken = signAccessToken({ id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone });
    const refreshToken = await issueRefreshToken(user.id, clientMeta(req).device, clientMeta(req).ip);
    res.status(201).json({ accessToken, refreshToken, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
  })
);

/**
 * POST /api/auth/login — identifier may be email OR phone.
 */
authRouter.post(
  '/login',
  authLimiter,
  asyncH(async (req, res) => {
    const { identifier, password } = loginSchema.parse(req.body);
    const id = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: id }, { phone: identifier.trim() }],
        deletedAt: null,
        isBlocked: false,
      },
    });
    if (!user?.passwordHash) throw ApiError.unauthorized('Invalid credentials');
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const accessToken = signAccessToken({ id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone });
    const refreshToken = await issueRefreshToken(user.id, clientMeta(req).device, clientMeta(req).ip);
    res.json({ accessToken, refreshToken, user: { id: user.id, role: user.role, name: user.name, email: user.email } });
  })
);

/**
 * POST /api/auth/refresh — single-use rotation with reuse detection.
 * Accepts token from JSON body (mobile) or httpOnly cookie (web).
 */
authRouter.post(
  '/refresh',
  asyncH(async (req, res) => {
    const raw = (req.body?.refreshToken as string) || (req.cookies?.['gsv_rt'] as string);
    if (!raw) throw ApiError.unauthorized('Refresh token missing', 'REFRESH_MISSING');
    const { userId, raw: nextRaw } = await rotateRefreshToken(raw, clientMeta(req).device, req.ip);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBlocked || user.deletedAt) throw ApiError.unauthorized('Account unavailable');
    const accessToken = signAccessToken({ id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone });
    res.json({ accessToken, refreshToken: nextRaw });
  })
);

/** POST /api/auth/logout — revoke everything for this user. */
authRouter.post(
  '/logout',
  requireAuth,
  asyncH(async (req, res) => {
    await revokeAllForUser(req.auth!.id);
    res.json({ ok: true });
  })
);

/** GET /api/auth/me */
authRouter.get(
  '/me',
  requireAuth,
  asyncH(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatarUrl: true, emailVerified: true, phoneVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw ApiError.notFound('User not found');
    res.json({ user });
  })
);
