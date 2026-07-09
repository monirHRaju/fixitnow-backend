/**
 * Zod validation schemas for category routes.
 */
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name is too long")
    .trim(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
