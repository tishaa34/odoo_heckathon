import { z } from 'zod';
import { VehicleStatus } from '@prisma/client';

const registration = z
  .string()
  .trim()
  .min(3, 'Registration number is too short.')
  .max(20)
  .transform((v) => v.toUpperCase());

export const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: registration,
    make: z.string().trim().min(1).max(50),
    model: z.string().trim().min(1).max(50),
    year: z.coerce.number().int().min(1950).max(2100).optional(),
    capacityKg: z.coerce.number().positive('Capacity must be greater than zero.').max(100000),
    odometerKm: z.coerce.number().min(0).max(10000000, 'Odometer must be at most 10,000,000 km.').optional(),
    acquisitionCost: z.coerce.number().min(0).max(100000000).optional(),
  }),
});

export const updateVehicleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      registrationNumber: registration.optional(),
      make: z.string().trim().min(1).max(50).optional(),
      model: z.string().trim().min(1).max(50).optional(),
      year: z.coerce.number().int().min(1950).max(2100).optional(),
      capacityKg: z.coerce.number().positive().max(100000).optional(),
      odometerKm: z.coerce.number().min(0).max(10000000, 'Odometer must be at most 10,000,000 km.').optional(),
      acquisitionCost: z.coerce.number().min(0).max(100000000).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required.' }),
});

export const listVehicleSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
  }),
});
