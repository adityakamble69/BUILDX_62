import { getAuthContext } from '../middleware/auth.js';
import { getMyReports } from '../services/reportService.js';
import {
  listNotifications,
  markNotificationsRead,
  countUnreadNotifications,
} from '../services/notificationService.js';
import { getWorkerTasks, createWorkerSubmission } from '../services/workerService.js';
import { getWorkerDisplayName } from './workersController.js';
import { toMeta } from '../utils/pagination.js';

/** GET /api/v1/me — smallest possible proof that the token verified (Phase 4). */
export function getMe(req, res) {
  const { userId, role } = getAuthContext(req);
  res.json({ data: { id: userId, role } });
}

export async function getMyReportsList(req, res) {
  const { userId } = getAuthContext(req);
  const { rows, total } = await getMyReports(userId, req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function getMyNotifications(req, res) {
  const { userId } = getAuthContext(req);
  const { rows, total } = await listNotifications(userId, req.query);
  res.json({ data: rows, meta: toMeta(req.query, total) });
}

export async function getMyUnreadNotificationCount(req, res) {
  const { userId } = getAuthContext(req);
  const count = await countUnreadNotifications(userId);
  res.json({ data: { count } });
}

export async function patchMyNotificationsRead(req, res) {
  const { userId } = getAuthContext(req);
  await markNotificationsRead(userId, req.body);
  res.status(204).send();
}

// --- Phase 5-worker: worker's own task + submission routes ---

/** GET /api/v1/me/tasks — worker's own assigned tasks. */
export async function getMyTasks(req, res) {
  const { userId } = getAuthContext(req);
  const data = await getWorkerTasks(userId);
  res.json({ data });
}

/** POST /api/v1/me/tasks/:id/submission — worker submits resolution evidence. */
export async function postMyTaskSubmission(req, res) {
  const { userId } = getAuthContext(req);
  const workerName = await getWorkerDisplayName(userId);
  const data = await createWorkerSubmission(userId, workerName, {
    taskId: req.params.id,
    resolutionImagePath: req.body.resolutionImagePath,
    details: req.body.details,
  });
  res.status(201).json({ data });
}