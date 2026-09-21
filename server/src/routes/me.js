import { Router } from 'express';
import { requireAuth, requireWorker } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getMe,
  getMyReportsList,
  getMyNotifications,
  getMyUnreadNotificationCount,
  patchMyNotificationsRead,
  getMyTasks,
  postMyTaskSubmission,
} from '../controllers/meController.js';
import {
  workerSubmissionSchema,
  workerTaskIdParamsSchema,
} from '../validators/meValidators.js';

const router = Router();
router.use(requireAuth);

router.get('/', getMe);
router.get('/reports', asyncHandler(getMyReportsList));
router.get('/notifications', asyncHandler(getMyNotifications));
router.get('/notifications/unread-count', asyncHandler(getMyUnreadNotificationCount));
router.patch('/notifications/read', asyncHandler(patchMyNotificationsRead));

// Worker-only routes. `requireWorker` rejects admins and citizens alike.
router.get('/tasks', requireWorker, asyncHandler(getMyTasks));
router.post(
  '/tasks/:id/submission',
  requireWorker,
  validate(workerTaskIdParamsSchema, 'params'),
  validate(workerSubmissionSchema),
  asyncHandler(postMyTaskSubmission),
);

export default router;