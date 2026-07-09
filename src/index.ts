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
import { validateEnv } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import categoryRoutes from "./routes/category.routes";
import serviceRoutes from "./routes/service.routes";
import technicianRoutes from "./routes/technician.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";

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

// Swagger/OpenAPI documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JSON endpoint for the raw OpenAPI spec
app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Placeholder for future route modules:
app.use("/api/auth", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", serviceRoutes);
app.use("/api", technicianRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", reviewRoutes);
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

// Validate environment before starting
validateEnv();

app.listen(env.PORT, () => {
  console.log(`FixItNow is running at http://localhost:${String(env.PORT).padEnd(33)}`);
});

export default app;