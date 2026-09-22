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

app.disable('x-powered-by');

// The API is called from a different origin (Vercel client + localhost:3000), so
// helmet's CORP header must allow cross-origin resource sharing for API responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: reflect the caller's Origin back (`origin: true`). The cors package handles
// the rest — no string-list matching, no trailing-whitespace bugs, no case-sensitivity
// issues. Real protection is not CORS anyway: every mutating route is guarded by
// requireAuth/requireAdmin on the server, and the browser never gets a valid token
// without going through Clerk. CORS here just needs to not break the browser.
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length'],
    maxAge: 600,
  }),
);

// Explicitly answer preflight OPTIONS for every route, before the JSON body parser
// and before clerkMiddleware. Express 5 requires a named wildcard (`/*splat`)
// instead of a bare `*`.
app.options('/*splat', cors());

// 2mb (not 100kb) because POST /ai/classify sends one compressed photo as base64
// in the JSON body. Every other route's payload is tiny text.
app.use(express.json({ limit: '2mb' }));

// Verifies the Bearer token when present and populates the auth context.
// It never rejects on its own — requireAuth / requireAdmin / requireWorker decide.
app.use(
  clerkMiddleware({
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  }),
);

// Health check lives outside /api/v1 (Render + uptime pinger).
app.get('/health', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
  });
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