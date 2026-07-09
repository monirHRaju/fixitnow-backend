/**
 * Payment routes.
 *
 * POST  /api/payments/create      — initiate SSLCommerz payment (customer)
 * POST  /api/payments/confirm     — SSLCommerz IPN callback (public)
 * GET   /api/payments             — list own payments (customer)
 * GET   /api/payments/:id         — single payment details (customer)
 */
import { Router } from "express";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPaymentSchema } from "../validators/payment.schema";
import * as paymentController from "../controllers/payment.controller";

const router = Router();

router.post("/payments/create", authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.post("/payments/confirm", paymentController.confirmPayment);
router.get("/payments", authenticate, paymentController.listPayments);
router.get("/payments/:id", authenticate, paymentController.getPayment);

export default router;