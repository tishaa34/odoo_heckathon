import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
    email: z.string().email('Invalid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must be at most 72 characters.'),
    role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role.' }) }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'refreshToken is required.'),
  }),
});

export type RegisterBody = z.infer<typeof registerSchema>['body'];
export type LoginBody = z.infer<typeof loginSchema>['body'];
