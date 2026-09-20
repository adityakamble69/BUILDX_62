import { AppError } from '../utils/AppError.js';

/**
 * Validates `req[source]` against a Zod schema and replaces it with the parsed
 * (coerced/defaulted) value. Every write endpoint uses this (rules.md §5).
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} [source]
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new AppError(
          'VALIDATION_ERROR',
          422,
          'Invalid request',
          result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
        ),
      );
    }
    req[source] = result.data;
    return next();
  };
}
