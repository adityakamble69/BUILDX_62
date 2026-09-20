import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';

/** Backs both `/stats/public` (City Health) and `/admin/stats` (Phase 7). */
export async function getPublicStats() {
  const [{ data: totals, error: totalsErr }, { data: byCategory, error: categoryErr }] = await Promise.all([
    supabase.rpc('get_public_stats').single(),
    supabase.rpc('get_category_breakdown'),
  ]);
  if (totalsErr || categoryErr) throw dbError('getPublicStats', totalsErr ?? categoryErr, 'Could not load stats');

  return { ...totals, byCategory };
}
