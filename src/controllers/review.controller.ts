/**
 * Review controller.
 * Handles customer reviews for completed bookings.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { NotFoundError, BadRequestError, ForbiddenError } from "../lib/errors";

/**
 * POST /api/reviews
 * Customer creates a review for a completed booking.
 */
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { bookingId, rating, comment } = req.body;

    // Verify booking exists and belongs to this customer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.customerId !== req.user!.id) {
      throw new ForbiddenError("You can only review your own bookings");
    }

    if (booking.status !== "COMPLETED") {
      throw new BadRequestError(
        `Cannot review a booking with status "${booking.status}". Only completed bookings can be reviewed.`
      );
    }

    // Check if already reviewed
    const existing = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existing) {
      throw new BadRequestError("This booking has already been reviewed");
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        userId: req.user!.id,
        rating,
        comment,
      },
      include: {
        booking: {
          select: {
            id: true,
            service: { select: { title: true } },
            technician: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Review submitted",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews
 * Customer lists their own reviews.
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user!.id },
      include: {
        booking: {
          select: {
            id: true,
            service: { select: { title: true } },
            technician: {
              select: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reviews/technician/:id
 * Public: list all reviews for a specific technician.
 */
export async function listByTechnician(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const techId = req.params.id as string;

    const tech = await prisma.technicianProfile.findUnique({
      where: { id: techId },
    });

    if (!tech) {
      throw new NotFoundError("Technician not found");
    }

    const reviews = await prisma.review.findMany({
      where: {
        booking: { technicianId: techId, status: "COMPLETED" },
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Compute aggregate stats
    const ratings = reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? parseFloat(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          )
        : null;

    res.json({
      success: true,
      data: {
        technician: {
          id: tech.id,
          name: (
            await prisma.user.findUnique({
              where: { id: tech.userId },
              select: { name: true },
            })
          )?.name,
        },
        stats: {
          totalReviews: reviews.length,
          averageRating: avgRating,
          distribution: {
            1: ratings.filter((r) => r === 1).length,
            2: ratings.filter((r) => r === 2).length,
            3: ratings.filter((r) => r === 3).length,
            4: ratings.filter((r) => r === 4).length,
            5: ratings.filter((r) => r === 5).length,
          },
        },
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
}