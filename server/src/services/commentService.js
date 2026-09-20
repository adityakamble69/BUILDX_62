import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';

/**
 * @param {string} reportId
 * @param {string} userId
 * @param {string} body
 * @param {boolean} isAdmin Set true only from an admin-authenticated route (Phase 7 adds one).
 */
export async function addComment(reportId, userId, body, isAdmin = false) {
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .maybeSingle();
  if (reportErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not add comment');
  if (!report) throw new AppError('NOT_FOUND', 404, 'Report not found');

  const { data, error } = await supabase
    .from('comments')
    .insert({ report_id: reportId, user_id: userId, body, is_admin: isAdmin })
    .select('id, body, is_admin, created_at, author:profiles(id, display_name, avatar_url)')
    .single();
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not add comment');
  return data;
}

/**
 * Citizens may only delete their own comment (architecture.md §9); admins deleting any
 * comment is a separate Phase 7 route (`DELETE /admin/comments/:id`) that skips this check.
 * @param {string} commentId
 * @param {string} userId
 */
export async function deleteOwnComment(commentId, userId) {
  const { data: comment, error: findErr } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .maybeSingle();
  if (findErr) throw new AppError('INTERNAL_ERROR', 500, 'Could not delete comment');
  if (!comment) throw new AppError('NOT_FOUND', 404, 'Comment not found');
  if (comment.user_id !== userId) throw new AppError('FORBIDDEN', 403, 'You can only delete your own comment');

  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw new AppError('INTERNAL_ERROR', 500, 'Could not delete comment');
}
