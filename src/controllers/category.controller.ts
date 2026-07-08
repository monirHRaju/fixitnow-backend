/**
 * Category controller.
 * GET  /api/categories         — list all categories (public)
 * POST /api/admin/categories   — create category (admin)
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

/**
 * GET /api/categories
 * List all categories.
 */
export async function list(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { services: true } },
      },
    });

    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category.
 */
export async function create(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, description, iconUrl } = req.body;

    const category = await prisma.category.create({
      data: { name, description, iconUrl },
    });

    res.status(201).json({
      success: true,
      message: "Category created",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}