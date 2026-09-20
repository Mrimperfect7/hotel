import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type AuthUser } from '../lib/auth.js';
import { ApiError } from '../lib/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

/** Requires a valid bearer token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(ApiError.unauthorized());
  try {
    req.auth = verifyAccessToken(header.slice(7));
    return next();
  } catch {
    return next(ApiError.unauthorized('Session expired, please log in again', 'TOKEN_INVALID'));
  }
}

/** Decodes the bearer token when present; continues as anonymous otherwise. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.auth = verifyAccessToken(header.slice(7));
    } catch {
      // Invalid token on an optional route → treat as anonymous (guest).
    }
  }
  return next();
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!roles.includes(req.auth.role)) {
      return next(ApiError.forbidden('Your role cannot access this resource'));
    }
    return next();
  };
}

/** Admin or above (ADMIN / SUPER_ADMIN). */
export const requireAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

/**
 * Web browsers authenticate with bearer tokens in localStorage for this API,
 * so classic CSRF does not apply to JSON APIs. The refresh cookie is scoped to
 * /api/auth only; for those endpoints we enforce an Origin check as defense in
 * depth against cross-site cookie attachment.
 */
export function assertSameOrigin(req: Request, _res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (origin && !/http:\/\/localhost:\d+/.test(origin) && process.env.WEB_ORIGIN !== origin) {
    return next(ApiError.forbidden('Cross-site refresh blocked', 'CSRF_BLOCKED'));
  }
  return next();
}
