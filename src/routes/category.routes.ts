/**
 * Category routes.
 * GET  /api/categories         — public listing
 * POST /api/categories         — admin create
 */
import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCategorySchema } from "../validators/category.schema";
import * as categoryController from "../controllers/category.controller";

const router = Router();

router.get("/categories", categoryController.list);

// Admin-only category creation
router.post(
  "/categories",
  authenticate,
  restrictTo("ADMIN"),
  validate(createCategorySchema),
  categoryController.create
);

export default router;