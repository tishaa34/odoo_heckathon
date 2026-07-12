import { ERROR_CODES } from '../constants';

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Operational (expected) error. Services throw these to signal a specific
 * HTTP outcome; the central errorHandler turns them into the JSON envelope.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly errors: FieldError[];
  public readonly isOperational = true;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    errors: FieldError[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(msg: string, errors: FieldError[] = []) {
    return new ApiError(400, msg, ERROR_CODES.VALIDATION_ERROR, errors);
  }
  static unauthorized(msg = 'Authentication required.') {
    return new ApiError(401, msg, ERROR_CODES.UNAUTHORIZED);
  }
  static forbidden(msg = 'You do not have permission to perform this action.') {
    return new ApiError(403, msg, ERROR_CODES.FORBIDDEN);
  }
  static notFound(msg = 'Resource not found.') {
    return new ApiError(404, msg, ERROR_CODES.NOT_FOUND);
  }
  static conflict(msg: string) {
    return new ApiError(409, msg, ERROR_CODES.CONFLICT);
  }
  /** 422 — request was well-formed but violates a business rule. */
  static businessRule(msg: string) {
    return new ApiError(422, msg, ERROR_CODES.BUSINESS_RULE_VIOLATION);
  }
  static validation(msg: string, errors: FieldError[]) {
    return new ApiError(422, msg, ERROR_CODES.VALIDATION_ERROR, errors);
  }
}
