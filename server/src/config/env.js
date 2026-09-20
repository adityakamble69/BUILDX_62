import 'dotenv/config';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Only Phase 1 variables are required now. Add Clerk/Supabase/AI keys here
// (as required) in the phase that first uses them, so startup fails fast.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),
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
