/**
 * Service routes.
 * GET /api/services — public listing with filters
 */
import { Router } from "express";
import * as serviceController from "../controllers/service.controller";

const router = Router();

router.get("/services", serviceController.list);

export default router;