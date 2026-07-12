import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

/**
 * Verifies the Bearer access token and populates req.user.
 * Rejects with 401 on missing/invalid/expired tokens.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header.'));
  }

  const token = header.slice(7).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'TokenExpiredError'
        ? 'Access token has expired.'
        : 'Invalid access token.';
    return next(ApiError.unauthorized(message));
  }
}
