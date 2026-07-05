/**
 * FixItNow Backend - Express Application Entry Point
 *
 * This file sets up the Express server with middleware and routes.
 * Phase 1: Basic server skeleton with health check endpoint.
 * Additional routes will be mounted in subsequent phases.
 *
 * Start the server: npm run dev
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

// Initialize Express application
const app = express();

// ==================== Global Middleware ====================

// Security headers (helmet)
app.use(helmet());

// CORS - allow cross-origin requests from the frontend
app.use(cors());

// Request logging (morgan)
app.use(morgan("dev"));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

// Health check - confirms the server is running
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "FixItNow API is running",
    timestamp: new Date().toISOString(),
  });
});

// Placeholder for future route modules:
// app.use("/api/auth", authRoutes);
// app.use("/api/services", serviceRoutes);
// app.use("/api/technicians", technicianRoutes);
// app.use("/api/categories", categoryRoutes);
// app.use("/api/bookings", bookingRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/admin", adminRoutes);

// ==================== Error Handling ====================

// 404 handler - for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ==================== Start Server ====================

app.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║        FixItNow Backend Server               ║
  ╠══════════════════════════════════════════════╣
  ║  Status: Running                             ║
  ║  Port:   ${String(env.PORT).padEnd(33)}║
  ║  Env:     ${env.NODE_ENV.padEnd(33)}║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;