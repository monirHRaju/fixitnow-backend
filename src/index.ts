/**
 * FixItNow Backend - Server Entry Point
 *
 * Imports the configured Express app and starts listening.
 * For local development only — Vercel uses api/index.ts instead.
 */
import app from "./app";
import { env, validateEnv } from "./config/env";

// Validate environment before starting
validateEnv();

app.listen(env.PORT, () => {
  console.log(`FixItNow is running at http://localhost:${String(env.PORT).padEnd(33)}`);
});