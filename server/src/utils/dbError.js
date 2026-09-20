import { logger } from './logger.js';
import { AppError } from './AppError.js';

/**
 * Every service swallowed the real Supabase/Postgres error and threw a bare
 * `AppError('INTERNAL_ERROR', ...)`, so a misconfigured DB (missing migration, bad
 * key, RLS denial, etc.) surfaced in the logs as just "Could not load reports" with no
 * way to tell *why* — this is the one place that logs the underlying `message` / `code`
 * / `details` / `hint` before handing back the safe, generic error rules.md §10 requires
 * for the client response.
 * @param {string} context short label for where this happened, e.g. "listReports"
 * @param {{ message?: string, code?: string, details?: string, hint?: string } | null | undefined} error
 *   the error object returned by a Supabase client call
 * @param {string} clientMessage safe message to show the user
 * @returns {AppError} throw the return value; this function does not throw itself
 */
export function dbError(context, error, clientMessage) {
  logger.error(`Supabase error in ${context}`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  });
  return new AppError('INTERNAL_ERROR', 500, clientMessage);
}
