import { supabase } from '../config/supabaseClient.js';
import { dbError } from '../utils/dbError.js';
import { toRange } from '../utils/pagination.js';

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
