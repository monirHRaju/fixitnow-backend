/**
 * Technician controller.
 * Handles public profile browsing and technician-specific management.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { NotFoundError, BadRequestError, ForbiddenError } from "../lib/errors";
import type { BookingStatus } from "@prisma/client";
import { parsePagination, paginationMeta } from "../lib/pagination";
import { sendBookingAccepted, sendBookingCompleted } from "../lib/email";

/**
 * GET /api/technicians
 * List all technicians with optional filters, include avg rating.
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { location, skill, minRate, maxRate, available } = req.query;

    const where: any = {};

    if (location) {
      where.location = { contains: location as string, mode: "insensitive" };
    }

    if (skill) {
      where.skills = { has: skill as string };
    }

    if (available === "true") {
      where.isAvailable = true;
    }

    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = parseInt(minRate as string, 10);
      if (maxRate) where.hourlyRate.lte = parseInt(maxRate as string, 10);
    }

    const { page, limit, skip } = parsePagination(req.query as any);
    const [total, technicians] = await Promise.all([
      prisma.technicianProfile.count({ where }),
      prisma.technicianProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: { select: { services: true, bookings: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Compute average rating from completed bookings with reviews
    const profileIds = technicians.map((t) => t.id);
    const bookings = await prisma.booking.findMany({
      where: {
        technicianId: { in: profileIds },
        status: "COMPLETED",
        review: { isNot: null },
      },
      select: { technicianId: true, review: { select: { rating: true } } },
    });

    const ratingMap = new Map<string, { sum: number; count: number }>();
    for (const b of bookings) {
      if (!b.review) continue;
      const entry = ratingMap.get(b.technicianId) ?? { sum: 0, count: 0 };
      entry.sum += b.review.rating;
      entry.count += 1;
      ratingMap.set(b.technicianId, entry);
    }

    const result = technicians.map((t) => {
      const r = ratingMap.get(t.id);
      const avgRating = r ? parseFloat((r.sum / r.count).toFixed(1)) : null;
      const reviewCount = r?.count ?? 0;
      return { ...t, avgRating, reviewCount };
    });

    res.json({ success: true, data: { technicians: result, pagination: paginationMeta(total, { page, limit, skip }) } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/technicians/:id
 * Full profile with services, availability, and recent reviews.
 */
export async function getById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tech = await prisma.technicianProfile.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
        availability: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
        services: {
          where: { isActive: true },
          include: { category: { select: { id: true, name: true } } },
          orderBy: { title: "asc" },
        },
      },
    });

    if (!tech) {
      throw new NotFoundError("Technician not found");
    }

    // Fetch reviews on completed bookings for this technician
    const reviews = await prisma.review.findMany({
      where: {
        booking: { technicianId: tech.id, status: "COMPLETED" },
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Compute rating stats
    const allRatings = reviews.map((r) => r.rating);
    const avgRating =
      allRatings.length > 0
        ? parseFloat((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1))
        : null;

    res.json({
      success: true,
      data: {
        technician: {
          ...tech,
          avgRating,
          reviewCount: reviews.length,
          reviews,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/technician/profile
 * Update own profile (authenticated technician only).
 */
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      throw new NotFoundError("Technician profile not found");
    }

    const { bio, skills, experience, hourlyRate, location } = req.body;

    const updated = await prisma.technicianProfile.update({
      where: { id: profile.id },
      data: { bio, skills, experience, hourlyRate, location },
    });

    res.json({
      success: true,
      message: "Profile updated",
      data: { technician: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/technician/availability
 * Bulk-replace availability slots (delete old, insert new).
 */
export async function updateAvailability(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      throw new NotFoundError("Technician profile not found");
    }

    const { slots } = req.body;

    // Delete all existing slots for this technician
    await prisma.availabilitySlot.deleteMany({
      where: { technicianId: profile.id },
    });

    // Insert new slots
    if (slots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: slots.map((slot: any) => ({
          technicianId: profile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
    }

    const updated = await prisma.availabilitySlot.findMany({
      where: { technicianId: profile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.json({
      success: true,
      message: "Availability updated",
      data: { slots: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/technician/bookings
 * View bookings assigned to the authenticated technician.
 */
export async function getBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      throw new NotFoundError("Technician profile not found");
    }

    const { status } = req.query;

    const where: any = { technicianId: profile.id };
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
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { id: true, title: true, price: true, durationMins: true } },
          payment: { select: { status: true, amount: true } },
        },
        orderBy: { scheduledAt: "desc" },
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

// Valid status transitions for technician actions
const ALLOWED_TRANSITIONS: Record<string, BookingStatus[]> = {
  REQUESTED: ["ACCEPTED", "DECLINED"],
  ACCEPTED: ["IN_PROGRESS"],
  PAID: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

/**
 * PATCH /api/technician/bookings/:id
 * Accept/decline/complete a booking (must own it).
 */
export async function updateBookingStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      throw new NotFoundError("Technician profile not found");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.technicianId !== profile.id) {
      throw new ForbiddenError("This booking does not belong to you");
    }

    const { status: newStatus } = req.body;

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[booking.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition from ${booking.status} to ${newStatus}`
      );
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: newStatus },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        technician: {
          select: {
            user: { select: { name: true, email: true } },
          },
        },
        service: { select: { id: true, title: true, price: true } },
      },
    });

    // Send email notifications for status transitions
    if (newStatus === "ACCEPTED") {
      sendBookingAccepted({
        customerEmail: updated.customer.email,
        customerName: updated.customer.name,
        technicianEmail: updated.technician.user.email,
        technicianName: updated.technician.user.name,
        serviceTitle: updated.service.title,
        price: updated.service.price,
        scheduledAt: updated.scheduledAt.toISOString(),
        address: updated.address,
        bookingId: updated.id,
        status: newStatus,
      }).catch((err) => console.error("[EMAIL] Failed to send accepted:", err));
    } else if (newStatus === "COMPLETED") {
      sendBookingCompleted({
        customerEmail: updated.customer.email,
        customerName: updated.customer.name,
        technicianName: updated.technician.user.name,
        serviceTitle: updated.service.title,
        price: updated.service.price,
        scheduledAt: "",
        address: "",
        bookingId: updated.id,
        status: newStatus,
      }).catch((err) => console.error("[EMAIL] Failed to send completed:", err));
    }

    res.json({
      success: true,
      message: `Booking ${newStatus.toLowerCase()}`,
      data: { booking: updated },
    });
  } catch (error) {
    next(error);
  }
}