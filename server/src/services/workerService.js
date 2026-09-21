import { clerkClient } from '@clerk/express';
import { supabase } from '../config/supabaseClient.js';
import { AppError } from '../utils/AppError.js';
import { dbError } from '../utils/dbError.js';

/**
 * Lists Clerk users with `publicMetadata.role === "worker"`. Paginates internally at
 * Clerk's max page size (500) — plenty for a demo, and simpler than maintaining a
 * mirror table of workers in Postgres.
 */
export async function listWorkers() {
  const { data } = await clerkClient.users.getUserList({ limit: 500 });
  const workers = (data ?? [])
    .filter((u) => u.publicMetadata?.role === 'worker')
    .map((u) => ({
      id: u.id,
      displayName:
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        u.username ||
        u.primaryEmailAddress?.emailAddress ||
        u.id,
      email: u.primaryEmailAddress?.emailAddress ?? null,
      avatarUrl: u.imageUrl ?? null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  return workers;
}

/** @param {string} workerId Clerk userId */
export async function getWorkerTasks(workerId) {
  const { data, error } = await supabase.rpc('get_worker_tasks', { p_worker_id: workerId });
  if (error) throw dbError('getWorkerTasks', error, 'Could not load your tasks');
  return data;
}

/**
 * Worker-side submission. Ownership is verified inside `worker_create_submission`
 * (sql/009_worker_role.sql) so a worker can never submit against someone else's task.
 *
 * @param {string} workerId Clerk userId (from requireWorker).
 * @param {string} workerName Display name for `submissions.assigned_person`.
 * @param {{ taskId: string, resolutionImagePath?: string, details?: string }} input
 */
export async function createWorkerSubmission(workerId, workerName, input) {
  const { data: submissionId, error } = await supabase.rpc('worker_create_submission', {
    p_task_id: input.taskId,
    p_worker_id: workerId,
    p_worker_name: workerName,
    p_resolution_image_path: input.resolutionImagePath ?? null,
    p_details: input.details ?? null,
  });
  if (error) {
    if (error.message?.includes('TASK_NOT_FOUND'))
      throw new AppError('NOT_FOUND', 404, 'Task not found');
    if (error.message?.includes('NOT_ASSIGNED_TO_YOU'))
      throw new AppError('FORBIDDEN', 403, 'This task is not assigned to you');
    throw dbError('createWorkerSubmission', error, 'Could not submit your resolution');
  }
  return { id: submissionId };
}