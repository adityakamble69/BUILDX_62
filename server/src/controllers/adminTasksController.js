import { getAuthContext } from '../middleware/auth.js';
import { ensureProfile } from '../services/profileService.js';
import { listTasks, createTask, updateTaskStatus } from '../services/taskService.js';
import { toMeta } from '../utils/pagination.js';

export async function getAdminTasks(req, res) {
  const { rows, total } = await listTasks(req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function postAdminTask(req, res) {
  const { userId } = getAuthContext(req);
  await ensureProfile(userId); // tasks.created_by → profiles.id (FK)
  const data = await createTask(userId, req.body);
  res.status(201).json({ data });
}

export async function patchAdminTaskStatus(req, res) {
  await updateTaskStatus(req.params.id, req.body.status);
  res.status(204).send();
}