import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { listTasks, createTask, updateTaskStatus } from '../services/taskService.js';
import { logger } from '../utils/logger.js';
import { toMeta } from '../utils/pagination.js';

export async function getAdminTasks(req, res) {
  const { rows, total } = await listTasks(req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function postAdminTask(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId); // tasks.created_by → profiles.id (FK)

  // notifications.user_id is a FK to profiles; assigned_to_id is not. Mirror the
  // worker now so the assignment bell can insert. A missing Clerk user must not
  // block creating the task.
  if (req.body.assignedToId) {
    try {
      await ensureProfile(req.body.assignedToId);
    } catch (err) {
      logger.warn('Could not upsert assigned worker profile', {
        workerId: req.body.assignedToId,
        message: err.message,
      });
    }
  }

  const data = await createTask(userId, req.body);
  res.status(201).json({ data });
}

export async function patchAdminTaskStatus(req, res) {
  await updateTaskStatus(req.params.id, req.body.status);
  res.status(204).send();
}