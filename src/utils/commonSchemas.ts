import { z } from 'zod';

/** Reusable UUID path param: { params: { id } }. */
export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid id format.') }),
});

/** Reusable list query with pagination/sort/search. Extend `.query` per module for filters. */
export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }),
});

/** OpenAPI helper: wrap a data schema in the standard success envelope. */
export const successEnvelope = (dataSchema: z.ZodTypeAny) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });
