/**
 * Prisma Client singleton.
 * Reuse the same PrismaClient instance across the entire app.
 * In development, the client is cached globally to survive hot-reloads.
 *
 * Prisma v7 requires a driver adapter for direct database connections.
 * Ref: https://pris.ly/d/connection-management
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "../config/env";

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
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(new pg.Pool({ connectionString: env.DATABASE_URL })),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;