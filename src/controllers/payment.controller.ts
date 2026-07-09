/**
 * Payment controller.
 * Handles SSLCommerz payment initiation and confirmation.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { env } from "../config/env";
import { initPayment, validatePayment, verifyIpnHash } from "../lib/sslcommerz";
import { NotFoundError, BadRequestError } from "../lib/errors";
import { parsePagination, paginationMeta } from "../lib/pagination";

/**
 * POST /api/payments/create
 * Initiate an SSLCommerz payment session for an ACCEPTED booking.
 */
export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { name: true, email: true, phone: true, address: true } },
        service: { select: { title: true, price: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.customerId !== req.user!.id) {
      throw new BadRequestError("You can only pay for your own bookings");
    }

    if (booking.status !== "ACCEPTED") {
      throw new BadRequestError(
        `Booking must be ACCEPTED before payment (current: ${booking.status})`
      );
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === "COMPLETED") {
      throw new BadRequestError("Payment already completed for this booking");
    }

    const tranId = `FN-${Date.now()}-${booking.id.slice(0, 8)}`;

    // Initiate SSLCommerz session
    const sslcResponse = await initPayment({
      totalAmount: booking.service.price,
      currency: "BDT",
      tranId,
      successUrl: `${req.protocol}://${req.get("host")}/api/payments/confirm`,
      failUrl: `${req.protocol}://${req.get("host")}/api/payments/fail`,
      cancelUrl: `${req.protocol}://${req.get("host")}/api/payments/cancel`,
      cusName: booking.customer.name,
      cusEmail: booking.customer.email,
      cusPhone: booking.customer.phone ?? booking.customer.email,
      cusAdd: booking.address,
      productName: booking.service.title,
      productCategory: "home-service",
      productProfile: "general",
    });

    if (sslcResponse.status !== "SUCCESS") {
      throw new BadRequestError(
        `Payment initiation failed: ${sslcResponse.failedreason ?? "Unknown error"}`
      );
    }

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        userId: req.user!.id,
        amount: booking.service.price,
        transactionId: tranId,
        status: "PENDING",
        provider: "sslcommerz",
      },
      update: {
        transactionId: tranId,
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: "Payment session created",
      data: {
        payment,
        gatewayUrl: sslcResponse.gateway_url,
        sessionKey: sslcResponse.sessionkey,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/confirm
 * SSLCommerz IPN (Instant Payment Notification) callback.
 *
 * Called by SSLCommerz after payment is completed on the gateway.
 * Validates hash, updates Payment and Booking status.
 */
export async function confirmPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, string>;

    // Verify the IPN hash
    const isValid = verifyIpnHash(body, env.SSLC_STORE_PASSWORD);

    if (!isValid && body["status"] === "VALID") {
      // Fall back to val_id validation if hash verification fails
      const valId = body["val_id"];
      if (valId) {
        const validation = await validatePayment({ valId });
        if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
          res.status(400).json({ success: false, message: "Payment validation failed" });
          return;
        }
      } else {
        res.status(400).json({ success: false, message: "Invalid IPN hash" });
        return;
      }
    }

    const tranId = body["tran_id"];
    const bankTranId = body["bank_tran_id"];

    if (!tranId) {
      res.status(400).json({ success: false, message: "Missing transaction ID" });
      return;
    }

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: { transactionId: tranId },
      include: { booking: true },
    });

    if (!payment) {
      res.status(404).json({ success: false, message: "Payment record not found" });
      return;
    }

    if (payment.status === "COMPLETED") {
      res.json({ success: true, message: "Payment already confirmed" });
      return;
    }

    // Update payment and booking
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          method: body["card_type"] ?? "sslcommerz",
          paidAt: new Date(),
          transactionId: bankTranId ?? tranId,
        },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "PAID" },
      }),
    ]);

    // Respond to SSLCommerz
    res.json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments
 * Customer lists their own payment history.
 */
export async function listPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const where = { userId: req.user!.id };

    const { page, limit, skip } = parsePagination(req.query as any);
    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              scheduledAt: true,
              service: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: { payments, pagination: paginationMeta(total, { page, limit, skip }) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/:id
 * Customer gets a single payment's details.
 */
export async function getPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id as string },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            address: true,
            service: { select: { title: true, price: true } },
            technician: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.userId !== req.user!.id) {
      throw new BadRequestError("You can only view your own payments");
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
}