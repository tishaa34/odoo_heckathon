import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { ERROR_CODES } from '../constants';
import { logger } from '../config/logger';
import { env } from '../config/env';

/** 404 fallback for unmatched routes. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found.`));
}

/**
 * Central error handler. Maps ApiError / Zod / known Prisma errors to the
 * consistent JSON envelope and logs everything with the request id.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Something went wrong.';
  let code: string = ERROR_CODES.INTERNAL_ERROR;
  let errors: { field: string; message: string }[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed.';
    errors = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = ERROR_CODES.CONFLICT;
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      message = `A record with this ${target} already exists.`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = ERROR_CODES.NOT_FOUND;
      message = 'The requested record was not found.';
    } else {
      statusCode = 400;
      code = ERROR_CODES.VALIDATION_ERROR;
      message = 'Database request error.';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Invalid data supplied to the database layer.';
  }

  const logMeta = { requestId: req.requestId, path: req.originalUrl, method: req.method, statusCode };
  if (statusCode >= 500) {
    logger.error((err as Error)?.message ?? 'Unknown error', { ...logMeta, stack: (err as Error)?.stack });
  } else {
    logger.warn(message, logMeta);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors.length ? { errors } : {}),
    ...(env.isProd ? {} : { requestId: req.requestId }),
  });
}
