import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';
import { toRange } from '../utils/pagination.js';

/**
 * Powers the navbar bell's unread dot (Phase 6). A separate `head: true` count query
 * instead of paginating `listNotifications` and counting client-side — cheap, and gives
 * an exact number instead of "unread in the first page".
 * @param {string} userId
 */
export async function countUnreadNotifications(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw dbError('countUnreadNotifications', error, 'Could not load notification count');
  return count ?? 0;
}

export async function listNotifications(userId, pagination) {
  const { from, to } = toRange(pagination);
  const { data, error, count } = await supabase
    .from('notifications')
    .select('id, report_id, message, is_read, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw dbError('listNotifications', error, 'Could not load notifications');
  return { rows: data, total: count ?? 0 };
}

/**
 * @param {string} userId
 * @param {{ id?: string, all?: boolean }} input
 */
export async function markNotificationsRead(userId, input) {
  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  query = input.id ? query.eq('id', input.id) : query.eq('is_read', false);

  const { error } = await query;
  if (error) throw dbError('markNotificationsRead', error, 'Could not update notifications');
}
