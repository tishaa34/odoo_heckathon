import { Prisma } from '@prisma/client';
import { prisma, PrismaTx } from '../config/prisma';
import { logger } from '../config/logger';

interface AuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Writes an audit trail row. Accepts an optional transaction client so the
 * audit write participates in the same transaction as the mutation it records.
 * Audit failures are logged but never break the primary operation.
 */
export async function recordAudit(input: AuditInput, tx?: PrismaTx): Promise<void> {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', {
      action: input.action,
      entity: input.entity,
      error: (err as Error).message,
    });
  }
}
