import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';

/**
 * Backs `/stats/public` (City Health + the landing page's live strip). `topOpenReports`
 * (Phase 8, `get_top_open_reports`, sql/006_phase8.sql) covers PRD FR16's "top upvoted
 * open issues" — the one City Health number `get_public_stats`/`get_category_breakdown`
 * don't already provide.
 */
export async function getPublicStats() {
  const [
    { data: totals, error: totalsErr },
    { data: byCategory, error: categoryErr },
    { data: topOpenReports, error: topErr },
  ] = await Promise.all([
    supabase.rpc('get_public_stats').single(),
    supabase.rpc('get_category_breakdown'),
    supabase.rpc('get_top_open_reports', { p_limit: 5 }),
  ]);
  const firstError = totalsErr ?? categoryErr ?? topErr;
  if (firstError) throw dbError('getPublicStats', firstError, 'Could not load stats');

  return { ...totals, byCategory, topOpenReports };
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
