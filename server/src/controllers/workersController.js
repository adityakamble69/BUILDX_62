import { clerkClient } from '@clerk/express';
import { listWorkers } from '../services/workerService.js';

/** Admin-only: list of workers for the "assign task" dropdown. */
export async function getAdminWorkers(_req, res) {
  const data = await listWorkers();
  res.json({ data });
}

/**
 * Resolves a Clerk user's display name. Used by the worker-side submission controller
 * so `submissions.assigned_person` gets a human-readable value rather than the raw id.
 * Fails soft (returns the id) — a missing Clerk user should not block a submission.
 */
export async function getWorkerDisplayName(userId) {
  try {
    const user = await clerkClient.users.getUser(userId);
    return (
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      userId
    );
  } catch {
    return userId;
  }
}