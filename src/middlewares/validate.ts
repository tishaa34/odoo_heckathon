import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates and *replaces* req.body/query/params with the parsed (coerced,
 * defaulted, stripped) values. The schema shape is `{ body?, query?, params? }`.
 * Guarantees controllers only ever see well-typed input.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body !== undefined) req.body = parsed.body;
      // query/params are read-only getters on some Express versions; assign safely.
      if (parsed.query !== undefined) Object.defineProperty(req, 'query', { value: parsed.query, configurable: true });
      if (parsed.params !== undefined) req.params = parsed.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.') || e.path.join('.'),
          message: e.message,
        }));
        return next(ApiError.validation('Validation failed.', errors));
      }
      next(err);
    }
  };
}
