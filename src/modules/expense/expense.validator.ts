import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

export const createExpenseSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    category: z.nativeEnum(ExpenseCategory, { errorMap: () => ({ message: 'Invalid expense category.' }) }),
    amount: z.coerce.number().positive('Amount must be greater than zero.').max(10000000),
    note: z.string().trim().max(500).optional(),
    incurredAt: z.coerce.date().optional(),
  }),
});

export const listExpenseSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
  }),
});
