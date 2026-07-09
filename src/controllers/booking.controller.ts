/**
 * Booking controller.
 * Handles customer booking lifecycle.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../lib/errors";
import type { BookingStatus } from "@prisma/client";
import { parsePagination, paginationMeta } from "../lib/pagination";
import { sendBookingCreated, sendBookingCancelled } from "../lib/email";

// Valid cancellation targets
const CANCELLABLE_STATUSES: BookingStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "PAID",
];

/**
 * POST /api/bookings
 * Customer creates a new booking.
 */
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { serviceId, technicianId, scheduledAt, address, notes } = req.body;

    // Validate technician profile exists
    const tech = await prisma.technicianProfile.findUnique({
      where: { id: technicianId },
      include: { availability: true },
    });

    if (!tech) {
      throw new NotFoundError("Technician not found");
    }

    if (!tech.isAvailable) {
      throw new BadRequestError("Technician is not currently available");
    }

    // Validate service exists and belongs to this technician
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    if (service.technicianId !== technicianId) {
      throw new BadRequestError("Service does not belong to this technician");
    }

    if (!service.isActive) {
      throw new BadRequestError("Service is no longer active");
    }

    // Validate booking time falls within availability slots
    const scheduled = new Date(scheduledAt);
    const dayOfWeek = scheduled.getDay(); // 0=Sun, 1=Mon ...
    const timeStr = `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`;

    const matchingSlot = tech.availability.find((slot) => {
      if (slot.dayOfWeek !== dayOfWeek) return false;
      return timeStr >= slot.startTime && timeStr <= slot.endTime;
    });

    if (!matchingSlot) {
      throw new BadRequestError(
        "The requested time is outside the technician's availability"
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: req.user!.id,
        technicianId,
        serviceId,
        scheduledAt: scheduled,
        address,
        notes,
        status: "REQUESTED",
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        technician: {
          select: {
            id: true,
            location: true,
            user: { select: { name: true } },
          },
        },
        service: { select: { id: true, title: true, price: true, durationMins: true } },
      },
    });

    // Send email notification
    sendBookingCreated({
      customerEmail: req.user!.email,
      customerName: req.user!.name,
      technicianName: booking.technician.user.name,
      serviceTitle: booking.service.title,
      price: booking.service.price,
      scheduledAt: booking.scheduledAt.toISOString(),
      address: booking.address,
      bookingId: booking.id,
      status: booking.status,
    }).catch((err) => console.error("[EMAIL] Failed to send booking created:", err));

    res.status(201).json({
      success: true,
      message: "Booking created",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings
 * Customer lists their own bookings with optional status filter.
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.query;

    const where: any = { customerId: req.user!.id };
    if (status) {
      where.status = status as BookingStatus;
    }

    const { page, limit, skip } = parsePagination(req.query as any);
    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          technician: {
            select: {
              id: true,
              location: true,
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          service: { select: { id: true, title: true, price: true, durationMins: true } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: { bookings, pagination: paginationMeta(total, { page, limit, skip }) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/bookings/:id
 * Customer gets a single booking with full details.
 */
export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        technician: {
          select: {
            id: true,
            bio: true,
            location: true,
            skills: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        service: { select: { id: true, title: true, description: true, price: true, durationMins: true } },
        payment: { select: { status: true, amount: true, method: true, transactionId: true, paidAt: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Only the owner or the assigned technician can view
    if (
      booking.customerId !== req.user!.id &&
      !(req.user!.role === "TECHNICIAN")
    ) {
      throw new ForbiddenError("You do not have access to this booking");
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/bookings/:id/cancel
 * Customer cancels their booking.
 */
export async function cancel(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.customerId !== req.user!.id) {
      throw new ForbiddenError("You can only cancel your own bookings");
    }

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      throw new BadRequestError(
        `Cannot cancel a booking in status "${booking.status}"`
      );
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
      include: {
        customer: { select: { name: true, email: true } },
        technician: {
          select: {
            user: { select: { name: true } },
          },
        },
        service: { select: { title: true, price: true } },
        payment: { select: { status: true } },
      },
    });

    // Send cancellation email
    sendBookingCancelled({
      customerEmail: req.user!.email,
      customerName: req.user!.name,
      technicianName: updated.technician?.user?.name ?? "Technician",
      serviceTitle: updated.service.title,
      price: updated.service.price,
      scheduledAt: "",
      address: "",
      bookingId: updated.id,
      status: "CANCELLED",
    }).catch((err) => console.error("[EMAIL] Failed to send cancellation:", err));

    res.json({
      success: true,
      message: "Booking cancelled",
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
}