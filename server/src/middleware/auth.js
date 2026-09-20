import { getAuth } from '@clerk/express';
import { AppError } from '../utils/AppError.js';

/**
 * Reads the verified Clerk session off the request. `clerkMiddleware` must run first
 * (wired in `src/index.js`), otherwise `getAuth` throws.
 *
 * Role comes from the session token claim `metadata.role`, which exists only because the
 * Clerk dashboard maps it (Sessions → Customize session token):
 *   { "metadata": "{{user.public_metadata}}" }
 * Anything other than "admin" is a citizen (rules.md §8).
 *
 * @returns {{ userId: string | null, role: 'admin' | 'citizen' }}
 */
export function getAuthContext(req) {
  const { userId, sessionClaims } = getAuth(req);
  return {
    userId: userId ?? null,
    role: sessionClaims?.metadata?.role === 'admin' ? 'admin' : 'citizen',
  };
}

/** 401 unless a valid Clerk session is attached. */
export function requireAuth(req, _res, next) {
  const { userId } = getAuthContext(req);
  if (!userId) return next(new AppError('UNAUTHORIZED', 401, 'Sign in to continue'));
  return next();
}

/**
 * 401 without a session, 403 without the admin role. This is the real protection;
 * the frontend guards are cosmetic (architecture.md §9).
 */
export function requireAdmin(req, _res, next) {
  const { userId, role } = getAuthContext(req);
  if (!userId) return next(new AppError('UNAUTHORIZED', 401, 'Sign in to continue'));
  if (role !== 'admin') return next(new AppError('FORBIDDEN', 403, 'Admin access required'));
  return next();
}
