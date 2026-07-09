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

/**
 * Validate that required environment variables are set.
 * Call this during server startup to fail early.
 */
export function validateEnv(): void {
  const required = [
    { key: "DATABASE_URL", value: env.DATABASE_URL },
    { key: "JWT_SECRET", value: env.JWT_SECRET },
  ];

  const missing = required.filter((r) => !r.value || r.value === "change-me-to-a-random-secret-in-production");
  const warnings = missing
    .map((r) => {
      if (r.value === "change-me-to-a-random-secret-in-production") {
        return `⚠️  WARNING: JWT_SECRET is still set to default value. Change it in production!`;
      }
      return `❌  MISSING: ${r.key} is not set. Check your .env file.`;
    })
    .filter(Boolean);

  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(w);
    }
    if (warnings.some((w) => w.startsWith("❌"))) {
      console.error("❌ Server cannot start without required environment variables.");
      process.exit(1);
    }
  }

  console.log("✅ Environment configuration validated");
}