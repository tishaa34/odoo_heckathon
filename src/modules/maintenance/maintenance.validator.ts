import { z } from 'zod';
import { MaintenanceStatus } from '@prisma/client';

export const openMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicleId.'),
    type: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional(),
    cost: z.coerce.number().min(0).optional(),
  }),
});

export const closeMaintenanceSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ cost: z.coerce.number().min(0).optional() }).optional(),
});

export const listMaintenanceSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    status: z.nativeEnum(MaintenanceStatus).optional(),
    vehicleId: z.string().uuid().optional(),
  }),
});
