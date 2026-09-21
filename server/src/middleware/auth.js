import { getAuth } from '@clerk/express';
import { AppError } from '../utils/AppError.js';

/**
 * Pulls the verified session out of the request. `clerkMiddleware` (index.js) has
 * already validated the token by the time we get here, so this is a read, not a check.
 * @returns {{ userId: string | null, role: string | null }}
 */
export function getAuthContext(req) {
  const auth = getAuth(req);
  return {
    userId: auth.userId ?? null,
    role: auth.sessionClaims?.metadata?.role ?? null,
  };
}

/** 401 if there is no valid Clerk session. */
export function requireAuth(req, _res, next) {
  const { userId } = getAuthContext(req);
  if (!userId) return next(new AppError('UNAUTHORIZED', 401, 'Sign in required'));
  return next();
}

/** 403 unless the session's publicMetadata.role === "admin". */
export function requireAdmin(req, _res, next) {
  const { userId, role } = getAuthContext(req);
  if (!userId) return next(new AppError('UNAUTHORIZED', 401, 'Sign in required'));
  if (role !== 'admin') return next(new AppError('FORBIDDEN', 403, 'Admin role required'));
  return next();
}

/**
 * Phase 5-worker — 403 unless the session's publicMetadata.role === "worker".
 * Admins are NOT automatically workers (the two roles are independent), so an admin
 * hitting /me/tasks gets a clean 403 instead of an empty list.
 */
export function requireWorker(req, _res, next) {
  const { userId, role } = getAuthContext(req);
  if (!userId) return next(new AppError('UNAUTHORIZED', 401, 'Sign in required'));
  if (role !== 'worker') return next(new AppError('FORBIDDEN', 403, 'Worker role required'));
  return next();
}