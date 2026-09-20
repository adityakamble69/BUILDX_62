import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Service-role client — the ONLY way this codebase talks to Postgres (rules.md §7:
 * never import Supabase from the frontend; architecture.md §2: Express is the single
 * enforcement point). This key bypasses RLS entirely, so every query below must
 * scope itself correctly (e.g. `reporter_id = req.auth.userId`) instead of relying
 * on RLS to do it.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
