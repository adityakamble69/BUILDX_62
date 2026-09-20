import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { toRange } from '../utils/pagination.js';
import { getCategoryIdBySlug } from './categoryService.js';

// Selected on every list/detail read from `reports_with_coords` (see sql/004_phase5.sql
// for why lat/lng need the view instead of the bare `reports` table).
const REPORT_SUMMARY_SELECT = `
  id, title, status, severity, area_name, upvote_count, lat, lng, created_at, resolved_at,
  category:categories(id, slug, name, icon),
  department:departments(id, name),
  images:report_images(storage_path, kind)
`;

const REPORT_DETAIL_SELECT = `
  id, title, description, status, severity, area_name, upvote_count, lat, lng,
  created_at, updated_at, resolved_at, reject_reason,
  category:categories(id, slug, name, icon),
  department:departments(id, name),
  images:report_images(id, storage_path, kind, created_at),
  reporter:profiles(id, display_name, avatar_url)
`;

/**
 * @param {{ status?: string, category?: string, sort: 'newest'|'upvotes', page: number, pageSize: number }} filters
 */
export async function listReports(filters) {
  let query = supabase.from('reports_with_coords').select(REPORT_SUMMARY_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) {
    const categoryId = await getCategoryIdBySlug(filters.category);
    query = query.eq('category_id', categoryId);
  }

  query = query.order(filters.sort === 'upvotes' ? 'upvote_count' : 'created_at', { ascending: false });

  const { from, to } = toRange(filters);
  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not load reports');
  return { rows: data, total: count ?? 0 };
}

/**
 * Lightweight points for the map, capped at 1000 (rules.md §16). This stays an RPC
 * (`get_map_points`, sql/002_functions.sql) rather than the view above because it also
 * excludes rejected reports and enforces the cap in SQL, not in the API layer.
 * @param {{ status?: string, category?: string }} filters
 */
export async function getMapPoints(filters) {
  const categoryId = filters.category ? await getCategoryIdBySlug(filters.category) : null;
  const { data, error } = await supabase.rpc('get_map_points', {
    p_category: categoryId,
    p_status: filters.status ?? null,
  });
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not load map points');
  return data;
}

export async function getReportDetail(id) {
  const { data: report, error } = await supabase
    .from('reports_with_coords')
    .select(REPORT_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not load the report');
  if (!report) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const [{ data: comments, error: commentsErr }, { data: history, error: historyErr }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, body, is_admin, created_at, author:profiles(id, display_name, avatar_url)')
      .eq('report_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('status_history')
      .select('id, from_status, to_status, note, created_at')
      .eq('report_id', id)
      .order('created_at', { ascending: true }),
  ]);
  if (commentsErr || historyErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not load the report');

  return { ...report, comments, statusHistory: history };
}

/**
 * @param {{ lat: number, lng: number, category: string, radius: number }} params
 */
export async function findNearbyDuplicates({ lat, lng, category, radius }) {
  const categoryId = await getCategoryIdBySlug(category);
  const { data, error } = await supabase.rpc('nearby_duplicates', {
    p_lat: lat,
    p_lng: lng,
    p_category: categoryId,
    p_radius: radius,
  });
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not check for duplicates');
  return data;
}

/**
 * @param {string} reporterId Clerk userId (caller must have called ensureProfile first).
 * @param {{ title, description, category, severity, lat, lng, areaName, imagePaths }} input
 */
export async function createReport(reporterId, input) {
  const categoryId = await getCategoryIdBySlug(input.category);

  const { data, error } = await supabase.rpc('create_report', {
    p_reporter_id: reporterId,
    p_category_id: categoryId,
    p_title: input.title,
    p_description: input.description,
    p_severity: input.severity,
    p_lat: input.lat,
    p_lng: input.lng,
    p_area_name: input.areaName ?? null,
    p_image_paths: input.imagePaths,
  });
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not create the report');

  return getReportDetail(data);
}

/**
 * @param {string} reportId
 * @param {string} userId
 * @returns {Promise<{ upvoted: boolean, upvoteCount: number }>}
 */
export async function toggleUpvote(reportId, userId) {
  const { data: exists, error: existsErr } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .maybeSingle();
  if (existsErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not toggle upvote');
  if (!exists) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const { data: upvoted, error } = await supabase.rpc('toggle_upvote', {
    p_report_id: reportId,
    p_user_id: userId,
  });
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not toggle upvote');

  const { data: report, error: countErr } = await supabase
    .from('reports')
    .select('upvote_count')
    .eq('id', reportId)
    .single();
  if (countErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not toggle upvote');

  return { upvoted, upvoteCount: report.upvote_count };
}

export async function getMyReports(userId, pagination) {
  const { from, to } = toRange(pagination);
  const { data, error, count } = await supabase
    .from('reports_with_coords')
    .select(REPORT_SUMMARY_SELECT, { count: 'exact' })
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not load your reports');
  return { rows: data, total: count ?? 0 };
}
