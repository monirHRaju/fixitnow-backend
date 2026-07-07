/**
 * Authentication routes.
 * POST  /api/auth/register  — create a new account
 * POST  /api/auth/login     — log in with email + password
 * GET   /api/auth/me        — get current user profile (authenticated)
 */
import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { registerSchema, loginSchema } from "../validators/auth.schema";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);

export default router;