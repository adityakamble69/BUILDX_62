import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';
import { logger } from '../utils/logger.js';
import { toRange } from '../utils/pagination.js';

const TASK_SELECT = `
  id, report_id, department_id, title, description, assigned_to, assigned_to_id, priority,
  task_date, due_date, status, created_at, updated_at,
  report:reports(id, title, status, severity, area_name,
    category:categories!reports_category_id_fkey(slug, name)),
  department:departments(id, name)
`;

/**
 * @param {{ status?: string, department?: number, priority?: string, page?: number, pageSize?: number }} filters
 */
export async function listTasks(filters) {
  let query = supabase.from('tasks').select(TASK_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.department) query = query.eq('department_id', filters.department);
  if (filters.priority) query = query.eq('priority', filters.priority);

  query = query
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { from, to } = toRange(filters);
  const { data, error, count } = await query.range(from, to);
  if (error) throw dbError('listTasks', error, 'Could not load tasks');
  return { rows: data, total: count ?? 0 };
}

/**
 * @param {string} adminId Clerk userId — caller must have called ensureProfile first
 *   (tasks.created_by is a FK to profiles).
 * @param {{ reportId, departmentId?, title, description?, assignedTo?, assignedToId?, priority, taskDate?, dueDate? }} input
 *   `assignedToId` is the Clerk userId of the worker (Phase 5-worker). `assignedTo` remains
 *   a free-text label — either can be set independently.
 */
export async function createTask(adminId, input) {
  const { data: taskId, error } = await supabase.rpc('create_task', {
    p_report_id: input.reportId,
    p_department_id: input.departmentId ?? null,
    p_title: input.title,
    p_description: input.description ?? null,
    p_assigned_to: input.assignedTo ?? null,
    p_assigned_to_id: input.assignedToId ?? null,
    p_priority: input.priority,
    p_task_date: input.taskDate ?? null,
    p_due_date: input.dueDate ?? null,
    p_created_by: adminId,
  });
  if (error) {
    if (error.message?.includes('REPORT_NOT_FOUND'))
      throw new AppError('NOT_FOUND', 404, 'Report not found');
    throw dbError('createTask', error, 'Could not create the task');
  }

  const { data: row, error: readErr } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', taskId)
    .single();
  if (readErr) throw dbError('createTask(read)', readErr, 'Could not load the new task');

  if (input.assignedToId) {
    await notifyWorkerAssigned({
      workerId: input.assignedToId,
      reportId: input.reportId,
      title: input.title,
    });
  }

  return row;
}

/**
 * In-app bell for the worker. Kept in the API (not inside `create_task`) so existing
 * SQL does not need a new migration. Failure is logged, not thrown — the task row is
 * already committed and the worker can still see it on `/worker/tasks`.
 */
async function notifyWorkerAssigned({ workerId, reportId, title }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: workerId,
    report_id: reportId,
    message: `A new task was assigned to you: "${title}".`,
  });
  if (error) {
    logger.error('Could not notify worker of assignment', {
      workerId,
      reportId,
      message: error.message,
      code: error.code,
    });
  }
}

/** @param {string} taskId @param {'pending'|'in_progress'|'completed'} status */
export async function updateTaskStatus(taskId, status) {
  const { error } = await supabase.rpc('update_task_status', {
    p_task_id: taskId,
    p_status: status,
  });
  if (error) {
    if (error.message?.includes('TASK_NOT_FOUND'))
      throw new AppError('NOT_FOUND', 404, 'Task not found');
    throw dbError('updateTaskStatus', error, 'Could not update the task status');
  }
}