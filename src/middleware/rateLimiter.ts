/**
 * Rate limiting middleware.
 * Protects API endpoints from abuse by limiting request frequency.
 */
import rateLimit from "express-rate-limit";

/**
 * General API rate limit (100 requests per 15 minutes per IP).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

/**
 * Stricter rate limit for authentication endpoints (10 requests per 15 minutes).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

/**
 * Payment endpoint rate limit (5 requests per 15 minutes).
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment requests, please try again later",
  },
});