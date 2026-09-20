import { logger } from '../utils/logger.js';

export function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

// Central error handler: never leak stack traces or raw errors to clients.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err?.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Malformed JSON body' } });
  }

  if (err?.code === 'CORS_FORBIDDEN') {
    return res.status(403).json({ error: { code: 'CORS_FORBIDDEN', message: 'Origin not allowed' } });
  }

  const status = Number.isInteger(err?.status) ? err.status : 500;
  if (status >= 500) logger.error('Unhandled error', { message: err?.message, stack: err?.stack });

  res.status(status).json({
    error: {
      code: err?.code ?? 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong' : err.message,
    },
  });
}
