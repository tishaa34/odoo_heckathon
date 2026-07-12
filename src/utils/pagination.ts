import { PAGINATION } from '../constants';
import { PaginationMeta } from './ApiResponse';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sort?: string;
  order: 'asc' | 'desc';
  search?: string;
}

/**
 * Normalises raw query params into safe pagination/sort values.
 * Query values arrive as strings (already Zod-coerced upstream where used).
 */
export function buildPagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(Number(query.page) || PAGINATION.DEFAULT_PAGE, 1);
  const rawLimit = Number(query.limit) || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), PAGINATION.MAX_LIMIT);
  const order = query.order === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    sort: typeof query.sort === 'string' ? query.sort : undefined,
    order,
    search: typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined,
  };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Builds a Prisma orderBy object from a whitelisted set of sortable fields. */
export function buildOrderBy(
  sort: string | undefined,
  order: 'asc' | 'desc',
  allowed: string[],
  fallback = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field = sort && allowed.includes(sort) ? sort : fallback;
  return { [field]: order };
}
