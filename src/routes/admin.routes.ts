/**
 * Admin routes for platform management.
 * All routes require ADMIN role authentication.
 *
 * GET    /api/admin/dashboard      — platform statistics / dashboard overview
 * GET    /api/admin/users          — list all users
 * PATCH  /api/admin/users/:id      — ban/unban a user
 * GET    /api/admin/bookings       — list all bookings (admin view)
 * GET    /api/admin/categories     — list all categories
 * POST   /api/admin/categories     — create a new category
 */
import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCategorySchema } from "../validators/category.schema";
import * as adminController from "../controllers/admin.controller";
import * as categoryController from "../controllers/category.controller";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, restrictTo("ADMIN"));

router.get("/dashboard", adminController.dashboard);
router.get("/users", adminController.listUsers);
router.patch("/users/:id", adminController.toggleBan);
router.get("/bookings", adminController.listBookings);
router.get("/categories", categoryController.list);
router.post("/categories", validate(createCategorySchema), categoryController.create);

export default router;