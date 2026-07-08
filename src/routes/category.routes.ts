/**
 * Category routes.
 * GET  /api/categories         — public listing
 * POST /api/admin/categories   — admin create (handled in admin routes)
 */
import { Router } from "express";
import * as categoryController from "../controllers/category.controller";

const router = Router();

router.get("/categories", categoryController.list);

export default router;