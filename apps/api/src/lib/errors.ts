import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** Typed error with HTTP status + machine-readable code. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(msg = 'Invalid request', code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, code, msg, details);
  }
  static unauthorized(msg = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, msg);
  }
  static forbidden(msg = 'You do not have permission to do that', code = 'FORBIDDEN') {
    return new ApiError(403, code, msg);
  }
  static notFound(msg = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, msg);
  }
  static conflict(msg: string, code = 'CONFLICT') {
    return new ApiError(409, code, msg);
  }
  static unavailable(msg = 'Not enough rooms available for your dates', code = 'OUT_OF_STOCK') {
    return new ApiError(409, code, msg);
  }
  static internal(msg = 'Internal error') {
    return new ApiError(500, 'INTERNAL', msg);
  }
}

/** Wrap an async handler so rejections reach the error middleware. */
export function asyncH(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Express error middleware — never leaks internals to clients. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message, details: err.details });
  }
  // Prisma known errors mapped to safe messages.
  const anyErr = err as { code?: string; message?: string };
  if (anyErr?.code === 'P2002') {
    return res.status(409).json({ error: 'DUPLICATE', message: 'That record already exists.' });
  }
  if (anyErr?.code === 'P2025') {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Record not found.' });
  }
  if (anyErr?.code === 'P2034') {
    // Transaction conflict: another booking claimed the last rooms first.
    return res.status(409).json({ error: 'OUT_OF_STOCK', message: 'Someone just booked these rooms. Please adjust your selection.' });
  }
  // eslint-disable-next-line no-console
  console.error('[api] unhandled:', err);
  return res.status(500).json({ error: 'INTERNAL', message: 'Something went wrong. Please try again.' });
}

/** 404 for unknown API routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found.' });
}
