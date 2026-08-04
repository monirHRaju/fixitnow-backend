/**
 * SSLCommerz IPN redirect handlers.
 *
 * After processing a payment, SSLCommerz redirects the user's browser to these
 * URLs. They redirect straight back to the frontend success/fail/cancel pages.
 * The authoritative payment confirmation happens server-to-server via the IPN
 * (POST /api/payments/confirm), so these GET handlers only need to bounce.
 */
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

function redirectWith(res: Response, status: "success" | "fail" | "cancel", q: Record<string, unknown>): void {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const qs = params.toString();
  res.redirect(302, `${env.FRONTEND_URL}/payment/${status}${qs ? `?${qs}` : ""}`);
}

export async function paymentSuccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    redirectWith(res, "success", {
      bookingId: req.query.bookingId,
      tran_id: req.query.tran_id,
      transactionId: req.query.bank_tran_id ?? req.query.tran_id,
    });
  } catch (error) {
    next(error);
  }
}

export async function paymentFail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    redirectWith(res, "fail", {
      tran_id: req.query.tran_id,
      error: req.query.error,
    });
  } catch (error) {
    next(error);
  }
}

export async function paymentCancel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    redirectWith(res, "cancel", {
      tran_id: req.query.tran_id,
    });
  } catch (error) {
    next(error);
  }
}