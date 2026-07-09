/**
 * Booking routes.
 * All require authentication (customer).
 *
 * POST   /api/bookings               — create booking
 * GET    /api/bookings                — list own bookings
 * GET    /api/bookings/:id            — single booking details
 * PATCH  /api/bookings/:id/cancel     — cancel own booking
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createBookingSchema,
} from "../validators/booking.schema";
import * as bookingController from "../controllers/booking.controller";

const router = Router();

router.post("/bookings", authenticate, validate(createBookingSchema), bookingController.create);
router.get("/bookings", authenticate, bookingController.list);
router.get("/bookings/:id", authenticate, bookingController.getById);
router.patch("/bookings/:id/cancel", authenticate, bookingController.cancel);

export default router;