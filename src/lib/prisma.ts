/**
 * Prisma Client singleton.
 * Reuse the same PrismaClient instance across the entire app.
 * In development, the client is cached globally to survive hot-reloads.
 */
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances during hot-reload in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * The single PrismaClient instance used throughout the application.
 * Import this file wherever you need database access.
 *
 * Usage:
 *   import prisma from "@/lib/prisma";
 *   const users = await prisma.user.findMany();
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;