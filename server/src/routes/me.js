import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationSchema } from '../utils/pagination.js';
import { notificationsReadSchema } from '../validators/notificationValidators.js';
import {
  getMe,
  getMyReportsList,
  getMyNotifications,
  patchMyNotificationsRead,
} from '../controllers/meController.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(getMe));
router.get('/reports', validate(paginationSchema, 'query'), asyncHandler(getMyReportsList));
router.get('/notifications', validate(paginationSchema, 'query'), asyncHandler(getMyNotifications));
router.patch('/notifications/read', validate(notificationsReadSchema), asyncHandler(patchMyNotificationsRead));

export default router;
