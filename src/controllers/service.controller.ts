/**
 * Service controller.
 * GET /api/services — list services with filters (public)
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

/**
 * GET /api/services
 * List active services with optional filters:
 *   ?category=   — filter by category ID
 *   ?search=     — search by title/description
 *   ?minPrice=   — minimum price
 *   ?maxPrice=   — maximum price
 *   ?location=   — filter by technician location
 *   ?technician= — filter by technician ID
 */
export async function list(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      location,
      technician,
    } = req.query;

    // Build where clause
    const where: any = { isActive: true };

    if (category) {
      where.categoryId = category as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice as string, 10);
      if (maxPrice) where.price.lte = parseInt(maxPrice as string, 10);
    }

    if (location) {
      where.technician = { location: { contains: location as string, mode: "insensitive" } };
    }

    if (technician) {
      where.technicianId = technician as string;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        technician: {
          select: {
            id: true,
            location: true,
            hourlyRate: true,
            isAvailable: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach average rating per service from reviews
    // (computed via the bookings that have reviews)
    const serviceIds = services.map((s) => s.id);
    const bookings = await prisma.booking.findMany({
      where: { serviceId: { in: serviceIds }, review: { isNot: null } },
      select: { serviceId: true, review: { select: { rating: true } } },
    });

    // Build rating map
    const ratingMap = new Map<string, { sum: number; count: number }>();
    for (const b of bookings) {
      if (!b.review) continue;
      const entry = ratingMap.get(b.serviceId) ?? { sum: 0, count: 0 };
      entry.sum += b.review.rating;
      entry.count += 1;
      ratingMap.set(b.serviceId, entry);
    }

    const servicesWithRating = services.map((service) => {
      const r = ratingMap.get(service.id);
      const avgRating = r ? parseFloat((r.sum / r.count).toFixed(1)) : null;
      const reviewCount = r?.count ?? 0;
      return { ...service, avgRating, reviewCount };
    });

    res.json({
      success: true,
      data: { services: servicesWithRating },
    });
  } catch (error) {
    next(error);
  }
}