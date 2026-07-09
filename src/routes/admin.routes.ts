/**
 * Admin routes for platform management.
 * All routes require ADMIN role authentication.
 *
 * GET    /api/admin/dashboard  — platform statistics / dashboard overview
 * GET    /api/admin/users      — list all users
 * PATCH  /api/admin/users/:id/ban  — ban/unban a user
 * GET    /api/admin/bookings   — list all bookings (admin view)
 */
import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import * as adminController from "../controllers/admin.controller";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, restrictTo("ADMIN"));

router.get("/dashboard", adminController.dashboard);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/ban", adminController.toggleBan);
router.get("/bookings", adminController.listBookings);

export default router;