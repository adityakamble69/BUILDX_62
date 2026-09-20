import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

/** Backs both `/stats/public` (City Health) and `/admin/stats` (Phase 7). */
export async function getPublicStats() {
  const [{ data: totals, error: totalsErr }, { data: byCategory, error: categoryErr }] = await Promise.all([
    supabase.rpc('get_public_stats').single(),
    supabase.rpc('get_category_breakdown'),
  ]);
  if (totalsErr || categoryErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not load stats');

  return { ...totals, byCategory };
}
