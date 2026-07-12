import { z } from 'zod';

export const createFuelSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicleId.'),
    tripId: z.string().uuid().optional(),
    liters: z.coerce.number().positive('Liters must be greater than zero.').max(10000),
    cost: z.coerce.number().positive('Cost must be greater than zero.').max(1000000),
    odometerKm: z.coerce.number().min(0).optional(),
    filledAt: z.coerce.date().optional(),
  }),
});

export const listFuelSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
  }),
});
