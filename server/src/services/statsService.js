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

/**
 * Admin dashboard KPI cards + charts (architecture.md `GET /admin/stats`). Separate RPC
 * from `get_public_stats` because the admin cards need every status individually
 * (Reported/pending as its own number), not just the public page's coarser total/resolved/
 * in_progress split.
 * @param {number} [trendDays]
 */
export async function getAdminStats(trendDays = 7) {
  const [
    { data: totals, error: totalsErr },
    { data: byCategory, error: categoryErr },
    { data: byDepartment, error: departmentErr },
    { data: trend, error: trendErr },
  ] = await Promise.all([
    supabase.rpc('get_admin_stats').single(),
    supabase.rpc('get_category_breakdown'),
    supabase.rpc('get_department_breakdown'),
    supabase.rpc('get_reports_trend', { p_days: trendDays }),
  ]);
  const firstError = totalsErr ?? categoryErr ?? departmentErr ?? trendErr;
  if (firstError) throw dbError('getAdminStats', firstError, 'Could not load admin stats');

  return { ...totals, byCategory, byDepartment, trend };
}

/** Points for the admin heatmap (design.md §9 — teal → amber → red by density). */
export async function getHeatmapPoints() {
  const { data, error } = await supabase.rpc('get_heatmap_points');
  if (error) throw dbError('getHeatmapPoints', error, 'Could not load heatmap points');
  return data;
}
