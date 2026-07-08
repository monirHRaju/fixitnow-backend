/**
 * Technician routes.
 * Public:
 *   GET  /api/technicians      — list all technicians
 *   GET  /api/technicians/:id  — full profile
 *
 * Authenticated (technician):
 *   PUT  /api/technician/profile         — update own profile
 *   PUT  /api/technician/availability    — bulk-set availability slots
 *   GET  /api/technician/bookings        — view own bookings
 *   PATCH /api/technician/bookings/:id   — accept/decline/complete
 */
import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  updateProfileSchema,
  updateAvailabilitySchema,
  updateBookingStatusSchema,
} from "../validators/technician.schema";
import * as technicianController from "../controllers/technician.controller";

const router = Router();

// === Public ===
router.get("/technicians", technicianController.list);
router.get("/technicians/:id", technicianController.getById);

// === Technician-only ===
router.put(
  "/technician/profile",
  authenticate,
  restrictTo("TECHNICIAN"),
  validate(updateProfileSchema),
  technicianController.updateProfile
);

router.put(
  "/technician/availability",
  authenticate,
  restrictTo("TECHNICIAN"),
  validate(updateAvailabilitySchema),
  technicianController.updateAvailability
);

router.get(
  "/technician/bookings",
  authenticate,
  restrictTo("TECHNICIAN"),
  technicianController.getBookings
);

router.patch(
  "/technician/bookings/:id",
  authenticate,
  restrictTo("TECHNICIAN"),
  validate(updateBookingStatusSchema),
  technicianController.updateBookingStatus
);

export default router;