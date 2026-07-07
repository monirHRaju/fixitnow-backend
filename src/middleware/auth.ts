/**
 * Authentication middleware.
 *
 * authenticate    — requires a valid JWT, attaches user to req
 * optionalAuth   — same but silently continues if no token
 * restrictTo     — checks req.user.role is in allowed roles
 */
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import prisma from "../lib/prisma";
import { UnauthorizedError, ForbiddenError } from "../lib/errors";
import type { UserRole } from "@prisma/client";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        isBanned: boolean;
      };
    }
  }
}

/**
 * Middleware: require a valid JWT in the Authorization header.
 * Extracts user from DB and attaches to req.user.
 * Returns 401 if missing, invalid, or user is banned.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isBanned: true },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.isBanned) {
      throw new ForbiddenError("Your account has been banned");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
}

/**
 * Middleware: optionally authenticate.
 * If a valid token is present, attaches user. Otherwise silently continues.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isBanned: true },
    });

    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    // Silently ignore invalid tokens
  }

  next();
}

/**
 * Middleware: restrict access to specific roles.
 * Must be used after `authenticate`.
 */
export function restrictTo(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }

    next();
  };
}