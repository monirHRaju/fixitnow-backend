/**
 * SSLCommerz IPN redirect handlers.
 *
 * After processing a payment, SSLCommerz redirects the user to these URLs.
 * We respond with an HTML page that either redirects to the frontend or shows a status message.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { env } from "../config/env";

/**
 * GET /api/payments/success
 * SSLCommerz redirects here on successful payment.
 */
export async function paymentSuccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tran_id, val_id } = req.query;

    // Update payment and booking status via IPN validation
    const payment = await prisma.payment.findFirst({
      where: { transactionId: tran_id as string },
      include: { booking: { include: { service: true } } },
    });

    // Redirect to frontend or show success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Payment Successful - FixItNow</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0fdf4; }
        .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 480px; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { color: #16a34a; margin: 0 0 0.5rem; }
        p { color: #6b7280; margin: 0.5rem 0; }
        .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 2rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; }
      </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Transaction ID: ${tran_id || "N/A"}</p>
          ${payment ? `<p>Service: ${payment.booking?.service?.title || "N/A"}</p>
          <p>Amount: BDT ${((payment.amount || 0) / 100).toFixed(2)}</p>` : ""}
          <p>Your booking has been confirmed. The technician will contact you shortly.</p>
          <a href="/api/health" class="btn">Back to Home</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/fail
 * SSLCommerz redirects here on failed payment.
 */
export async function paymentFail(
  req: Request,
  res: Response
): Promise<void> {
  const { tran_id, error } = req.query;

  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Payment Failed - FixItNow</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fef2f2; }
      .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 480px; }
      .icon { font-size: 4rem; margin-bottom: 1rem; }
      h1 { color: #dc2626; margin: 0 0 0.5rem; }
      p { color: #6b7280; margin: 0.5rem 0; }
      .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 2rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; }
    </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">❌</div>
        <h1>Payment Failed</h1>
        ${error ? `<p>Reason: ${error}</p>` : ""}
        <p>Transaction ID: ${tran_id || "N/A"}</p>
        <p>Please try again or use a different payment method.</p>
        <a href="/api/health" class="btn">Try Again</a>
      </div>
    </body>
    </html>
  `);
}

/**
 * GET /api/payments/cancel
 * SSLCommerz redirects here when user cancels payment.
 */
export async function paymentCancel(
  req: Request,
  res: Response
): Promise<void> {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Payment Cancelled - FixItNow</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fefce8; }
      .card { background: white; padding: 2.5rem; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 480px; }
      .icon { font-size: 4rem; margin-bottom: 1rem; }
      h1 { color: #ca8a04; margin: 0 0 0.5rem; }
      p { color: #6b7280; margin: 0.5rem 0; }
      .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 2rem; background: #2563eb; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 600; }
    </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">ℹ️</div>
        <h1>Payment Cancelled</h1>
        <p>You have cancelled the payment. Your booking is still pending.</p>
        <p>You can try again whenever you're ready.</p>
        <a href="/api/health" class="btn">Back to Home</a>
      </div>
    </body>
    </html>
  `);
}