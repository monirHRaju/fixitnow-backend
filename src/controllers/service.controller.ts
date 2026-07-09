/**
 * Service controller.
 * GET /api/services — list services with filters (public)
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { NotFoundError, BadRequestError } from "../lib/errors";

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

/**
 * POST /api/technician/services
 * Create a new service (authenticated technician only).
 */
export async function create(
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

    const { categoryId, title, description, price, durationMins } = req.body;

    // Verify the category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    const service = await prisma.service.create({
      data: {
        technicianId: profile.id,
        categoryId,
        title,
        description,
        price,
        durationMins,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: "Service created",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/technician/services/:id
 * Update own service (authenticated technician only).
 */
export async function update(
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

    const service = await prisma.service.findUnique({
      where: { id: req.params.id as string },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    if (service.technicianId !== profile.id) {
      throw new BadRequestError("You can only update your own services");
    }

    const { categoryId, title, description, price, durationMins, isActive } = req.body;

    // If categoryId provided, verify it exists
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundError("Category not found");
      }
    }

    const updated = await prisma.service.update({
      where: { id: service.id },
      data: { categoryId, title, description, price, durationMins, isActive },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: "Service updated",
      data: { service: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/technician/services/:id
 * Delete own service (authenticated technician only).
 * Soft-delete by setting isActive=false.
 */
export async function remove(
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

    const service = await prisma.service.findUnique({
      where: { id: req.params.id as string },
    });

    if (!service) {
      throw new NotFoundError("Service not found");
    }

    if (service.technicianId !== profile.id) {
      throw new BadRequestError("You can only delete your own services");
    }

    // Soft-delete — set inactive
    await prisma.service.update({
      where: { id: service.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Service deleted",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/technician/services
 * List own services (authenticated technician only).
 */
export async function listMyServices(
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

    const { includeInactive } = req.query;

    const where: any = { technicianId: profile.id };
    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: { services } });
  } catch (error) {
    next(error);
  }
}