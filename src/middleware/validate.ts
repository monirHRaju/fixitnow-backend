/**
 * Zod validation middleware factory.
 * Validates request body/query/params against a Zod schema before the handler runs.
 *
 * Usage (in route files):
 *   import { z } from "zod";
 *   import { validate } from "../middleware/validate";
 *
 *   const loginSchema = z.object({ email: z.string().email(), password: z.string() });
 *   router.post("/login", validate(loginSchema), loginHandler);
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequestError } from "../lib/errors";

/**
 * Creates middleware that validates `req.body` against the given schema.
 * On success, replaces req.body with the parsed (and possibly transformed) data.
 * On failure, throws a BadRequestError with formatted validation messages.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Parse and transform the request body
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a user-friendly message
        const messages = error.issues.map(
          (e: any) => `${e.path?.join(".") || ""}: ${e.message}`
        );
        next(new BadRequestError(messages.join("; ")));
      } else {
        next(error);
      }
    }
  };
}