import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';

/**
 * Everything the `/admin/analytics` page needs in one round trip. Reuses
 * `get_category_breakdown` (Phase 2) and `get_admin_stats` (Phase 7) rather than
 * duplicating their SQL, and adds two Phase 7.5 RPCs (`get_analytics_kpis`,
 * `get_department_performance`, sql/007_tasks_submissions.sql).
 */
export async function getAnalytics() {
  const [
    { data: kpis, error: kpiErr },
    { data: byCategory, error: categoryErr },
    { data: byDepartment, error: departmentErr },
    { data: statusRow, error: statusErr },
  ] = await Promise.all([
    supabase.rpc('get_analytics_kpis').single(),
    supabase.rpc('get_category_breakdown'),
    supabase.rpc('get_department_performance'),
    supabase.rpc('get_admin_stats').single(),
  ]);
  const firstErr = kpiErr ?? categoryErr ?? departmentErr ?? statusErr;
  if (firstErr) throw dbError('getAnalytics', firstErr, 'Could not load analytics');

  return {
    kpis,
    byCategory,
    byDepartment,
    statusDistribution: {
      reported: statusRow?.reported ?? 0,
      in_progress: statusRow?.in_progress ?? 0,
      resolved: statusRow?.resolved ?? 0,
      rejected: statusRow?.rejected ?? 0,
    },
  };
}

/**
 * Incomplete = still `reported` or `in_progress`. `get_incomplete_reports` has no
 * WHERE params because it's a small set; search/department filtering happens here
 * rather than adding a second SQL signature for demo-scale data.
 * @param {{ search?: string, department?: number }} [filters]
 */
export async function getIncompleteReports(filters = {}) {
  const { data, error } = await supabase.rpc('get_incomplete_reports');
  if (error) throw dbError('getIncompleteReports', error, 'Could not load incomplete reports');

  let rows = data ?? [];
  if (filters.department) rows = rows.filter((r) => r.department_id === Number(filters.department));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((r) => r.title?.toLowerCase().includes(q));
  }
  return { rows };
}