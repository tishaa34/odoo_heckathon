import { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * central error handler instead of hanging the request.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
