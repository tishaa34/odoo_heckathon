/**
 * Central place for cross-cutting constants. Enum *values* live in the Prisma
 * schema and are re-exported from @prisma/client; here we keep app-level tokens.
 */

export const ROLES = {
  FLEET_MANAGER: 'FLEET_MANAGER',
  DRIVER: 'DRIVER',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST',
} as const;

export type RoleName = keyof typeof ROLES;

/** Machine-readable error codes returned in the response envelope. */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

/** Audit actions recorded in the AuditLog table. */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  DISPATCH: 'DISPATCH',
  START: 'START',
  COMPLETE: 'COMPLETE',
  CANCEL: 'CANCEL',
  MAINTENANCE_OPEN: 'MAINTENANCE_OPEN',
  MAINTENANCE_CLOSE: 'MAINTENANCE_CLOSE',
  RETIRE: 'RETIRE',
  LOGIN: 'LOGIN',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
