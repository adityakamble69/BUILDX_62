/**
 * Wraps an async controller so a rejected promise reaches `errorHandler`
 * instead of being swallowed (rules.md §10).
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<unknown>} fn
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
