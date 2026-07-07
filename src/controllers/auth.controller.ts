/**
 * Authentication controller.
 * Handles register, login, and get current user.
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { hashPassword, comparePassword } from "../lib/password";
import { signToken } from "../lib/jwt";
import { ConflictError, UnauthorizedError, NotFoundError } from "../lib/errors";

/**
 * POST /api/auth/register
 * Create a new user account and return a JWT.
 * If role is TECHNICIAN, also creates an empty TechnicianProfile.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    // Hash password and create user
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-create TechnicianProfile if role is TECHNICIAN
    if (role === "TECHNICIAN") {
      await prisma.technicianProfile.create({
        data: { userId: user.id },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate with email and password, return a JWT.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBanned: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.isBanned) {
      throw new UnauthorizedError("Your account has been banned");
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signToken({ userId: user.id, role: user.role });

    // Strip password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        avatarUrl: true,
        isBanned: true,
        createdAt: true,
        technicianProfile: {
          select: {
            id: true,
            bio: true,
            skills: true,
            experience: true,
            hourlyRate: true,
            location: true,
            isAvailable: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}