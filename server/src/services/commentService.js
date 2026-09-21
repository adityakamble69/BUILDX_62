import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';

/**
 * @param {string} reportId
 * @param {string} userId
 * @param {string} body
 * @param {boolean} isAdmin Set true only from an admin-authenticated route.
 *
 * Phase 5-worker note: an admin commenting on their OWN report is not an official
 * response — they're just talking as the citizen who filed it. The `is_admin` flag is
 * only set when an admin replies to someone *else*'s report, so the "Official" badge
 * stays meaningful.
 */
export async function addComment(reportId, userId, body, isAdmin = false) {
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id, reporter_id')
    .eq('id', reportId)
    .maybeSingle();
  if (reportErr) throw dbError('addComment(report check)', reportErr, 'Could not add comment');
  if (!report) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const isOfficial = isAdmin && report.reporter_id !== userId;

  const { data, error } = await supabase
    .from('comments')
    .insert({ report_id: reportId, user_id: userId, body, is_admin: isOfficial })
    .select('id, body, is_admin, created_at, author:profiles(id, display_name, avatar_url)')
    .single();
  if (error) throw dbError('addComment', error, 'Could not add comment');
  return data;
}

/**
 * Citizens may only delete their own comment (architecture.md §9); admins deleting any
 * comment is a separate route (`DELETE /admin/comments/:id`) that skips this check.
 */
export async function deleteOwnComment(commentId, userId) {
  const { data: comment, error: findErr } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .maybeSingle();
  if (findErr) throw dbError('deleteOwnComment(find)', findErr, 'Could not delete comment');
  if (!comment) throw new AppError('NOT_FOUND', 404, 'Comment not found');
  if (comment.user_id !== userId) throw new AppError('FORBIDDEN', 403, 'You can only delete your own comment');

  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw dbError('deleteOwnComment', error, 'Could not delete comment');
}

/**
 * Admin moderation: delete any comment, no ownership check. Goes through the
 * `admin_delete_comment` RPC so a missing id surfaces as a clean 404.
 */
export async function adminDeleteComment(commentId) {
  const { error } = await supabase.rpc('admin_delete_comment', { p_comment_id: commentId });
  if (error) {
    if (error.message?.includes('COMMENT_NOT_FOUND')) throw new AppError('NOT_FOUND', 404, 'Comment not found');
    throw dbError('adminDeleteComment', error, 'Could not delete comment');
  }
}