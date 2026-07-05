/**
 * Custom error classes for structured API error handling.
 *
 * Each error has a statusCode and a message.
 * The errorHandler middleware catches these and returns proper HTTP responses.
 */

/**
 * Base application error with HTTP status code
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from programming bugs
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 400 Bad Request - Invalid input, validation errors
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - Authenticated but not permitted
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Resource already exists (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}