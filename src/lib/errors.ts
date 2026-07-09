/**
 * Custom error classes for structured API error handling.
 *
 * Each error has a statusCode and a message.
 * The errorHandler middleware catches these and returns proper HTTP responses.
 */

/**
 * Base application error with HTTP status code and optional error details
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorDetails?: any;

  constructor(message: string, statusCode: number = 500, errorDetails?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    this.errorDetails = errorDetails;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request - Invalid input, validation errors
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", errorDetails?: any) {
    super(message, 400, errorDetails);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required", errorDetails?: any) {
    super(message, 401, errorDetails);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - Authenticated but not permitted
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action", errorDetails?: any) {
    super(message, 403, errorDetails);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", errorDetails?: any) {
    super(message, 404, errorDetails);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Resource already exists (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists", errorDetails?: any) {
    super(message, 409, errorDetails);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}