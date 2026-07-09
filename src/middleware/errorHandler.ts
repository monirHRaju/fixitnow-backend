/**
 * Global error handling middleware.
 * Catches all errors thrown in route handlers and returns consistent JSON responses.
 *
 * In development mode, the error stack trace is included for debugging.
 * In production, only operational errors expose their message; programming errors
 * return a generic "Internal server error" message.
 */
import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 if no status code is set
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError
      ? err.message
      : "Internal server error";

  // Log the error for debugging
  console.error(`[ERROR] ${statusCode} - ${err.message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  const errorDetails =
    err instanceof AppError && err.errorDetails
      ? err.errorDetails
      : process.env.NODE_ENV === "development"
        ? { stack: err.stack }
        : undefined;

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails && { errorDetails }),
  });
}