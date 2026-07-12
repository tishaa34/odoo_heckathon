import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ERROR_CODES } from '../constants';

const jsonLimitResponse = (message: string) => ({
  success: false,
  message,
  code: ERROR_CODES.RATE_LIMITED,
});

/** Global limiter applied to all API routes. */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitResponse('Too many requests, please try again later.'),
});

/** Stricter limiter for auth endpoints to slow down credential-stuffing. */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonLimitResponse('Too many authentication attempts, please try again later.'),
});
