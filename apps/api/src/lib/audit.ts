import { prisma } from '@gsv/database';
import type { Request } from 'express';

/** Record an admin/owner action in the immutable audit log. */
export async function audit(
  req: Request,
  action: string,
  entity: string,
  entityId: string | null | undefined,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.id ?? null,
        actorRole: req.auth?.role ?? 'SYSTEM',
        action,
        entity,
        entityId: entityId ?? undefined,
        ip: req.ip,
        metadata: metadata as object | undefined,
      },
    });
  } catch (err) {
    // Audit must never break the main flow, but must be loud in logs.
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write entry', err);
  }
}
