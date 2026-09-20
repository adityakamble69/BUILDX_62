import { clerkClient } from '@clerk/express';
import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

/**
 * Lazily mirrors the Clerk user into `profiles` (rules.md §8). Called at the top of
 * every authenticated write, so `reports.reporter_id` etc. always satisfy their FK.
 * Cheap to call repeatedly: `upsert_profile` is `on conflict do update`.
 * @param {string} userId Clerk userId, verified by requireAuth.
 */
export async function ensureProfile(userId) {
  const user = await clerkClient.users.getUser(userId);
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    'Civic Fix user';

  const { error } = await supabase.rpc('upsert_profile', {
    p_id: userId,
    p_display_name: displayName,
    p_avatar_url: user.imageUrl ?? null,
  });
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not sync your profile');
}
