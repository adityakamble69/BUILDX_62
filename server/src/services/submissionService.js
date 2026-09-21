import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';
import { toRange } from '../utils/pagination.js';

const SUBMISSION_SELECT = `
  id, task_id, report_id, assigned_person, resolution_image_path, details,
  grade, remarks, status, submitted_at, reviewed_at,
  report:reports(id, title, status, area_name,
    category:categories!reports_category_id_fkey(slug, name)),
  task:tasks(id, title, priority, department_id, department:departments(id, name))
`;

/**
 * @param {{ status?: string, department?: number, search?: string, page?: number, pageSize?: number }} filters
 */
export async function listSubmissions(filters) {
  let query = supabase.from('submissions').select(SUBMISSION_SELECT, { count: 'exact' });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) query = query.ilike('assigned_person', `%${filters.search}%`);

  query = query.order('submitted_at', { ascending: false });

  const { from, to } = toRange(filters);
  const { data, error, count } = await query.range(from, to);
  if (error) throw dbError('listSubmissions', error, 'Could not load submissions');
  return { rows: data, total: count ?? 0 };
}

/**
 * @param {{ taskId, reportId, assignedPerson, resolutionImagePath?, details? }} input
 */
export async function createSubmission(input) {
  const { data: submissionId, error } = await supabase.rpc('create_submission', {
    p_task_id: input.taskId,
    p_report_id: input.reportId,
    p_assigned_person: input.assignedPerson,
    p_resolution_image_path: input.resolutionImagePath ?? null,
    p_details: input.details ?? null,
  });
  if (error) {
    if (error.message?.includes('TASK_NOT_FOUND'))
      throw new AppError('NOT_FOUND', 404, 'Task not found');
    throw dbError('createSubmission', error, 'Could not create the submission');
  }

  const { data: row, error: readErr } = await supabase
    .from('submissions')
    .select(SUBMISSION_SELECT)
    .eq('id', submissionId)
    .single();
  if (readErr) throw dbError('createSubmission(read)', readErr, 'Could not load the new submission');
  return row;
}

/**
 * @param {string} submissionId
 * @param {string} adminId Clerk userId — caller must have called ensureProfile first
 *   (submissions.reviewed_by is a FK to profiles).
 * @param {{ status: 'approved'|'needs_revision', grade?, remarks? }} input
 *   On approval the DB function also: closes the task, copies the resolution image to
 *   `report_images` (kind 'after'), and calls `change_report_status` → citizen notification
 *   (sql/007_tasks_submissions.sql).
 */
export async function reviewSubmission(submissionId, adminId, input) {
  const { error } = await supabase.rpc('review_submission', {
    p_submission_id: submissionId,
    p_to: input.status,
    p_admin_id: adminId,
    p_grade: input.grade ?? null,
    p_remarks: input.remarks ?? null,
  });
  if (error) {
    if (error.message?.includes('SUBMISSION_NOT_FOUND'))
      throw new AppError('NOT_FOUND', 404, 'Submission not found');
    throw dbError('reviewSubmission', error, 'Could not review the submission');
  }
}