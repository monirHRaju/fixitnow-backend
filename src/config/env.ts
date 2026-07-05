/**
 * Environment configuration loader.
 * All config values are read from process.env with sensible defaults.
 */
import dotenv from "dotenv";

// Load .env file into process.env
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  JWT_EXPIRES_IN: "7d",

  // Database URL is read by Prisma directly from process.env.DATABASE_URL
  DATABASE_URL: process.env.DATABASE_URL || "",

  // SSLCommerz
  SSLC_STORE_ID: process.env.SSLC_STORE_ID || "",
  SSLC_STORE_PASSWORD: process.env.SSLC_STORE_PASSWORD || "",
  SSLC_SANDBOX: process.env.SSLC_SANDBOX === "true",
} as const;