/**
 * Zod validation schemas for technician service management.
 */
import { z } from "zod";

export const createServiceSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title is too long")
    .trim(),
  description: z.string().max(1000).optional(),
  price: z
    .number()
    .int("Price must be a whole number (in paise)")
    .min(100, "Minimum price is 100 (1.00 BDT)"),
  durationMins: z
    .number()
    .int("Duration must be a whole number")
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours")
    .optional(),
});

export const updateServiceSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required").optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title is too long")
    .trim()
    .optional(),
  description: z.string().max(1000).optional(),
  price: z
    .number()
    .int("Price must be a whole number (in paise)")
    .min(100, "Minimum price is 100 (1.00 BDT)")
    .optional(),
  durationMins: z
    .number()
    .int("Duration must be a whole number")
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours")
    .optional(),
  isActive: z.boolean().optional(),
});