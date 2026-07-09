/**
 * Service routes.
 * GET  /api/services — public listing with filters
 *
 * Technician-managed (under /api/technician/services):
 * POST   — create service
 * PUT    — update service
 * DELETE — soft-delete service
 * GET    — list own services
 */
import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validators/service.schema";
import * as serviceController from "../controllers/service.controller";

const router = Router();

// Public listings
router.get("/services", serviceController.list);

// Technician-only: manage own services
router.post(
  "/technician/services",
  authenticate,
  restrictTo("TECHNICIAN"),
  validate(createServiceSchema),
  serviceController.create
);

router.put(
  "/technician/services/:id",
  authenticate,
  restrictTo("TECHNICIAN"),
  validate(updateServiceSchema),
  serviceController.update
);

router.delete(
  "/technician/services/:id",
  authenticate,
  restrictTo("TECHNICIAN"),
  serviceController.remove
);

router.get(
  "/technician/services",
  authenticate,
  restrictTo("TECHNICIAN"),
  serviceController.listMyServices
);

export default router;