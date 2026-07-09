/**
 * Payment routes.
 *
 * POST  /api/payments/create      — initiate SSLCommerz payment (customer)
 * POST  /api/payments/confirm     — SSLCommerz IPN callback (public)
 * GET   /api/payments             — list own payments (customer)
 * GET   /api/payments/:id         — single payment details (customer)
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { paymentLimiter } from "../middleware/rateLimiter";
import { createPaymentSchema } from "../validators/payment.schema";
import * as paymentController from "../controllers/payment.controller";
import * as paymentRedirectController from "../controllers/payment-redirect.controller";

const router = Router();

router.post("/payments/create", paymentLimiter, authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.post("/payments/confirm", paymentController.confirmPayment);
router.get("/payments/success", paymentRedirectController.paymentSuccess);
router.get("/payments/fail", paymentRedirectController.paymentFail);
router.get("/payments/cancel", paymentRedirectController.paymentCancel);
router.get("/payments", authenticate, paymentController.listPayments);
router.get("/payments/:id", authenticate, paymentController.getPayment);

export default router;