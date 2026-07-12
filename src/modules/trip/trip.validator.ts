import { z } from 'zod';
import { TripStatus } from '@prisma/client';

export const createTripSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicleId.'),
    driverId: z.string().uuid('Invalid driverId.'),
    origin: z.string().trim().min(2).max(120),
    destination: z.string().trim().min(2).max(120),
    cargoWeightKg: z.coerce.number().positive('Cargo weight must be greater than zero.').max(100000),
    scheduledAt: z.coerce.date().optional(),
    distanceKm: z.coerce.number().positive().max(100000).optional(),
    revenue: z.coerce.number().min(0).optional(),
  }),
});

export const cancelTripSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ reason: z.string().trim().max(255).optional() }).optional(),
});

export const listTripSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.nativeEnum(TripStatus).optional(),
    vehicleId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional(),
  }),
});
