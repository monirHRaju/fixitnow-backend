/**
 * Admin controller for platform management.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { NotFoundError } from "../lib/errors";

/**
 * GET /api/admin/dashboard
 * Platform statistics overview.
 */
export async function dashboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalUsers,
      totalTechnicians,
      totalAdmins,
      totalBookings,
      totalRevenue,
      recentBookings,
      pendingBookings,
      activeTechnicians,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TECHNICIAN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          service: { select: { title: true } },
        },
      }),
      prisma.booking.count({ where: { status: "REQUESTED" } }),
      prisma.technicianProfile.count({ where: { isAvailable: true } }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTechnicians,
          totalAdmins,
          totalBookings,
          totalRevenue: totalRevenue._sum.amount ?? 0,
          pendingBookings,
          activeTechnicians,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * List all users with pagination and role filter.
 */
export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const role = req.query.role as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role && ["CUSTOMER", "TECHNICIAN", "ADMIN"].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { customerBookings: true, payments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/ban
 * Toggle ban status on a user.
 */
export async function toggleBan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role === "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Cannot ban an admin user",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: !user.isBanned },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    res.json({
      success: true,
      message: updated.isBanned ? "User banned" : "User unbanned",
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/bookings
 * List all bookings with filters (admin view).
 */
export async function listBookings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          technician: {
            select: {
              id: true,
              location: true,
              user: { select: { name: true } },
            },
          },
          service: { select: { id: true, title: true, price: true } },
          payment: { select: { status: true, amount: true, provider: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}