import 'dotenv/config';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Variables are added here in the phase that first uses them, so startup fails fast.
// Phase 1: NODE_ENV/PORT/CLIENT_ORIGIN. Phase 4: Clerk. Phase 5: Supabase. AI keys follow later.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment variables', { issues: parsed.error.issues });
  process.exit(1);
}

// In production the real client URL must be set explicitly, otherwise CORS would silently block it.
if (parsed.data.NODE_ENV === 'production' && !process.env.CLIENT_ORIGIN) {
  logger.error('CLIENT_ORIGIN is required in production');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Trailing slash would break exact-match CORS comparison.
  CLIENT_ORIGIN: parsed.data.CLIENT_ORIGIN.replace(/\/$/, ''),
};
