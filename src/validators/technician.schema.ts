/**
 * Zod validation schemas for technician routes.
 */
import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.number().int().min(0).max(70).optional(),
  hourlyRate: z.number().int().min(0).optional(),
  location: z.string().max(200).optional(),
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"]),
});