import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Keys rate limits by the authenticated Clerk userId when present (accurate per-person
 * limiting even behind a shared IP), falling back to IP for guests hitting public routes.
 * clerkMiddleware has already run by the time these limiters are reached (rules.md §7).
 */
function keyGenerator(req) {
  return req.auth?.()?.userId || req.ip;
}

function limitHandler(_req, _res, next) {
  next(new AppError('RATE_LIMITED', 429, 'Too many requests — please slow down'));
}

/** Applied globally in index.js. */
export const globalRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: limitHandler,
});

/** POST /reports — 10 per hour per user (database.md §10). */
export const createReportRateLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: limitHandler,
});

/** POST /reports/:id/comments — stricter than the global limit, generous enough for real use. */
export const createCommentRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: limitHandler,
});

// Re-exported so routes only need one import for the "wrap async controllers" rule
// when a route has no other middleware to sit next to.
export { asyncHandler };
