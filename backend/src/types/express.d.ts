import { Role } from '@prisma/client';

/** Augments Express Request with fields populated by our middleware. */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export {};
