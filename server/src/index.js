import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clerkMiddleware } from '@clerk/express';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = new Set([env.CLIENT_ORIGIN, 'http://localhost:3000']);

app.disable('x-powered-by');
// The API is called from a different origin (the Vercel client), so CORP must allow it.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, Render health checks) are not browser CORS requests.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(Object.assign(new Error('Origin not allowed'), { code: 'CORS_FORBIDDEN' }));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);
app.use(express.json({ limit: '100kb' }));

// Verifies the Bearer token when one is present and populates the auth context.
// It never rejects on its own; requireAuth/requireAdmin decide that per route.
app.use(
  clerkMiddleware({
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  }),
);

// Health check lives outside /api/v1 (Render + uptime pinger).
app.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok', uptime: Math.round(process.uptime()), time: new Date().toISOString() } });
});

app.use('/api/v1', globalRateLimit, routes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  logger.info('Server started', { port: env.PORT, env: env.NODE_ENV });
});

// Render sends SIGTERM on deploy; finish in-flight requests before exiting.
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
