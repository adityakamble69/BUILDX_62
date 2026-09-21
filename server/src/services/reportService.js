import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';
import { toRange } from '../utils/pagination.js';
import { getCategoryIdBySlug } from './categoryService.js';

// Selected on every list/detail read from `reports_with_coords` (see sql/004_phase5.sql
// for why lat/lng need the view instead of the bare `reports` table).
const REPORT_SUMMARY_SELECT = `
  id, title, status, severity, area_name, upvote_count, lat, lng, created_at, resolved_at,
  category:categories!reports_category_id_fkey(id, slug, name, icon),
  department:departments(id, name),
  images:report_images(storage_path, kind)
`;

const REPORT_DETAIL_SELECT = `
  id, title, description, status, severity, area_name, upvote_count, lat, lng,
  created_at, updated_at, resolved_at, reject_reason,
  category:categories!reports_category_id_fkey(id, slug, name, icon),
  department:departments(id, name),
  images:report_images(id, storage_path, kind, created_at),
  reporter:profiles!reports_reporter_id_fkey(id, display_name, avatar_url)
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
  if (error) throw dbError('listReports', error, 'Could not load reports');
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
  if (error) throw dbError('getMapPoints', error, 'Could not load map points');
  return data;
}

/**
 * @param {string} id
 * @param {string | null} [viewerId] Clerk userId of the caller, if any — `getReportById` is a
 *   public route (no `requireAuth`), but `clerkMiddleware` still attaches the session when a
 *   token was sent, so a signed-in viewer can be told whether they've already upvoted without
 *   a second round trip (Phase 6: `UpvoteButton` needs this for correct optimistic UI).
 */
export async function getReportDetail(id, viewerId = null) {
  const { data: report, error } = await supabase
    .from('reports_with_coords')
    .select(REPORT_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw dbError('getReportDetail', error, 'Could not load the report');
  if (!report) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const [{ data: comments, error: commentsErr }, { data: history, error: historyErr }, viewerUpvote] =
    await Promise.all([
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
      viewerId
        ? supabase.from('upvotes').select('user_id').eq('report_id', id).eq('user_id', viewerId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
  if (commentsErr || historyErr)
    throw dbError('getReportDetail(comments/history)', commentsErr ?? historyErr, 'Could not load the report');
  if (viewerUpvote.error)
    throw dbError('getReportDetail(viewerUpvote)', viewerUpvote.error, 'Could not load the report');

  return { ...report, comments, statusHistory: history, viewerHasUpvoted: !!viewerUpvote.data };
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
  if (error) throw dbError('findNearbyDuplicates', error, 'Could not check for duplicates');
  return data;
}

/**
 * @param {string} reporterId Clerk userId (caller must have called ensureProfile first).
 * @param {{ title, description, category, severity, lat, lng, areaName, imagePaths, aiCategory?, aiSeverity? }} input
 *   `aiCategory`/`aiSeverity` (Phase 8) are what `POST /ai/classify` suggested, stored as
 *   audit fields — they never replace the citizen's own `category`/`severity` above.
 */
export async function createReport(reporterId, input) {
  const categoryId = await getCategoryIdBySlug(input.category);
  // A second, independent slug->id lookup: the AI suggestion is a different category from
  // the one actually filed whenever the citizen overrode it, so it can't reuse `categoryId`.
  const aiCategoryId = input.aiCategory ? await getCategoryIdBySlug(input.aiCategory) : null;

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
    p_ai_category_id: aiCategoryId,
    p_ai_severity: input.aiSeverity ?? null,
  });
  if (error) throw dbError('createReport', error, 'Could not create the report');

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
  if (existsErr) throw dbError('toggleUpvote(exists check)', existsErr, 'Could not toggle upvote');
  if (!exists) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const { data: upvoted, error } = await supabase.rpc('toggle_upvote', {
    p_report_id: reportId,
    p_user_id: userId,
  });
  if (error) throw dbError('toggleUpvote', error, 'Could not toggle upvote');

  const { data: report, error: countErr } = await supabase
    .from('reports')
    .select('upvote_count')
    .eq('id', reportId)
    .single();
  if (countErr) throw dbError('toggleUpvote(count refetch)', countErr, 'Could not toggle upvote');

  return { upvoted, upvoteCount: report.upvote_count };
}

// Admin table needs every status (citizen `listReports` never needs 'rejected' hidden,
// but the admin table also needs the reporter's identity, which citizen reads don't) —
// hence its own select against `admin_reports_view` (sql/005_phase7.sql) rather than
// reusing REPORT_SUMMARY_SELECT.
const ADMIN_REPORT_SELECT = `
  id, title, status, severity, area_name, upvote_count, lat, lng, created_at, resolved_at,
  category:categories!reports_category_id_fkey(id, slug, name, icon),
  department:departments(id, name),
  images:report_images(storage_path, kind),
  reporter:profiles!reports_reporter_id_fkey(id, display_name)
`;

/**
 * @param {{ status?, category?, department?, sort: 'newest'|'upvotes', page, pageSize }} filters
 *   `department` is a department id (int), unlike `category`, which is a slug.
 */
export async function listReportsAdmin(filters) {
  let query = supabase.from('admin_reports_view').select(ADMIN_REPORT_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.department) query = query.eq('department_id', filters.department);
  if (filters.category) {
    const categoryId = await getCategoryIdBySlug(filters.category);
    query = query.eq('category_id', categoryId);
  }

  const sortColumn = { upvotes: 'upvote_count', severity: 'severity' }[filters.sort] ?? 'created_at';
  query = query.order(sortColumn, { ascending: false });

  const { from, to } = toRange(filters);
  const { data, error, count } = await query.range(from, to);
  if (error) throw dbError('listReportsAdmin', error, 'Could not load reports');
  return { rows: data, total: count ?? 0 };
}

/**
 * @param {string} reportId
 * @param {string} adminId Clerk userId — caller must have called ensureProfile first
 *   (status_history.changed_by is a FK to profiles, memory.md "Notes for Later Phases").
 * @param {'reported'|'in_progress'|'resolved'|'rejected'} status
 * @param {string} [note]
 */
export async function updateReportStatus(reportId, adminId, status, note) {
  const { error } = await supabase.rpc('change_report_status', {
    p_report_id: reportId,
    p_to: status,
    p_admin_id: adminId,
    p_note: note ?? null,
  });
  if (error) {
    if (error.message?.includes('REPORT_NOT_FOUND')) throw new AppError('NOT_FOUND', 404, 'Report not found');
    throw dbError('updateReportStatus', error, 'Could not update the report status');
  }
}

/** @param {string} reportId @param {number} departmentId */
export async function assignReportDepartment(reportId, departmentId) {
  const { error } = await supabase.rpc('assign_report_department', {
    p_report_id: reportId,
    p_department_id: departmentId,
  });
  if (error) {
    if (error.message?.includes('REPORT_NOT_FOUND')) throw new AppError('NOT_FOUND', 404, 'Report not found');
    throw dbError('assignReportDepartment', error, 'Could not assign the department');
  }
}

/**
 * @param {string} reportId
 * @param {string} storagePath Path returned by `POST /uploads/sign`, already uploaded to Storage.
 * @param {string} adminId Clerk userId — caller must have called ensureProfile first
 *   (report_images.uploaded_by is a FK to profiles).
 */
export async function addResolutionImage(reportId, storagePath, adminId) {
  const { data, error } = await supabase.rpc('add_resolution_image', {
    p_report_id: reportId,
    p_storage_path: storagePath,
    p_admin_id: adminId,
  });
  if (error) throw dbError('addResolutionImage', error, 'Could not attach the resolution photo');
  return { id: data };
}

/** @param {string} reportId */
export async function deleteReport(reportId) {
  const { error } = await supabase.rpc('delete_report', { p_report_id: reportId });
  if (error) {
    if (error.message?.includes('REPORT_NOT_FOUND')) throw new AppError('NOT_FOUND', 404, 'Report not found');
    throw dbError('deleteReport', error, 'Could not delete the report');
  }
}

export async function getMyReports(userId, pagination) {
  const { from, to } = toRange(pagination);
  const { data, error, count } = await supabase
    .from('reports_with_coords')
    .select(REPORT_SUMMARY_SELECT, { count: 'exact' })
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw dbError('getMyReports', error, 'Could not load your reports');
  return { rows: data, total: count ?? 0 };
}
