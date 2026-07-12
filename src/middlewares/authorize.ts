import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * RBAC guard. Use after `authenticate`. Grants access only if the caller's
 * role is in the allowed set. Enforced entirely server-side.
 */
export function authorize(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role ${req.user.role} is not permitted to access this resource.`
        )
      );
    }
    return next();
  };
}
