import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

const phone = z.string().trim().regex(/^[+]?[\d\s-]{7,20}$/, 'Invalid phone number.');
const license = z.string().trim().min(3, 'License number is too short.').max(30).transform((v) => v.toUpperCase());

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email('Invalid email address.'),
    phone,
    licenseNumber: license,
    licenseExpiry: z.coerce.date({ errorMap: () => ({ message: 'Invalid license expiry date.' }) }),
  }),
});

export const updateDriverSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().email().optional(),
      phone: phone.optional(),
      licenseNumber: license.optional(),
      licenseExpiry: z.coerce.date().optional(),
      status: z.nativeEnum(DriverStatus).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required.' }),
});

export const listDriverSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
    status: z.nativeEnum(DriverStatus).optional(),
  }),
});
