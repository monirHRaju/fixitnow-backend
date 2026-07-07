/**
 * JWT utility functions.
 * signToken: creates a signed JWT for a user.
 * verifyToken: verifies and decodes a JWT token.
 */
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const SECRET = env.JWT_SECRET;
const EXPIRES_IN = env.JWT_EXPIRES_IN;

export interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * Sign a JWT token for the given payload.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT token.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}