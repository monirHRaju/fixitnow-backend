/**
 * Review routes.
 * Requires authentication (customer).
 *
 * POST   /api/reviews                — create review for completed booking
 * GET    /api/reviews                — list own reviews
 * GET    /api/reviews/technician/:id — list reviews for a technician (public)
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { z } from "zod";
import * as reviewController from "../controllers/review.controller";

const router = Router();

const createReviewSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(500, "Comment is too long").optional(),
});

router.post("/reviews", authenticate, validate(createReviewSchema), reviewController.create);
router.get("/reviews", authenticate, reviewController.list);
router.get("/reviews/technician/:id", reviewController.listByTechnician);

export default router;