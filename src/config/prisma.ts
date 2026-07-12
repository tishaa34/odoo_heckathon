import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

/**
 * Single shared PrismaClient instance (connection pooling handled by Prisma).
 * Reused across the app; never instantiate PrismaClient elsewhere.
 */
export const prisma = new PrismaClient({
  log: env.isProd ? ['warn', 'error'] : ['warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('🔌 Database disconnected');
}

/** Transaction client type — passed into repositories that run inside `$transaction`. */
export type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
