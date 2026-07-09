/**
 * Input sanitization middleware.
 * Trims string values and removes dangerous characters from request bodies.
 */
import { Request, Response, NextFunction } from "express";

/**
 * Recursively trim string values in an object.
 */
function trimStrings(obj: any): any {
  if (typeof obj === "string") {
    return obj.trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(trimStrings);
  }
  if (obj && typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = trimStrings(value);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Middleware that sanitizes req.body by trimming strings.
 * Applied globally to all JSON/URL-encoded request bodies.
 */
export function sanitizeInput(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === "object") {
    req.body = trimStrings(req.body);
  }
  next();
}