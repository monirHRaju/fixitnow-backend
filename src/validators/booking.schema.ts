/**
 * Zod validation schemas for booking routes.
 */
import { z } from "zod";
import { BookingStatus } from "@prisma/client";

const bookingStatusValues = Object.values(BookingStatus) as [string, ...string[]];

export const createBookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  technicianId: z.string().min(1, "Technician ID is required"),
  scheduledAt: z.string().datetime("Invalid datetime format (ISO 8601)"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  notes: z.string().max(500).optional(),
});

export const bookingQuerySchema = z.object({
  status: z.enum(bookingStatusValues as any).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});