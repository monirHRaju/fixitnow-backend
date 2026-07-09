/**
 * Zod validation schemas for payment routes.
 */
import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
});