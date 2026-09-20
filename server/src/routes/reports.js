import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReportRateLimit, createCommentRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  reportListQuerySchema,
  reportMapQuerySchema,
  nearbyDuplicatesQuerySchema,
  reportCreateSchema,
  reportIdParamsSchema,
} from '../validators/reportValidators.js';
import { commentCreateSchema } from '../validators/commentValidators.js';
import {
  getReports,
  getReportsMap,
  getReportById,
  getNearbyDuplicates,
  postReport,
  postUpvote,
} from '../controllers/reportsController.js';
import { postComment } from '../controllers/commentsController.js';

// Everything under /api/v1/reports. Mixes public reads and citizen writes in one
// router (rather than public.js + a second router) so route order is easy to get
// right: static paths (/map, /nearby-duplicates) MUST be registered before the
// dynamic /:id, or Express would match "/reports/map" against ":id" = "map" first.
const router = Router();

router.get('/', validate(reportListQuerySchema, 'query'), asyncHandler(getReports));
router.get('/map', validate(reportMapQuerySchema, 'query'), asyncHandler(getReportsMap));
router.get(
  '/nearby-duplicates',
  requireAuth,
  validate(nearbyDuplicatesQuerySchema, 'query'),
  asyncHandler(getNearbyDuplicates),
);

router.post('/', requireAuth, createReportRateLimit, validate(reportCreateSchema), asyncHandler(postReport));

router.post(
  '/:id/upvote',
  requireAuth,
  validate(reportIdParamsSchema, 'params'),
  asyncHandler(postUpvote),
);

router.post(
  '/:id/comments',
  requireAuth,
  createCommentRateLimit,
  validate(reportIdParamsSchema, 'params'),
  validate(commentCreateSchema),
  asyncHandler(postComment),
);

// Dynamic GET last: everything above is either a different method or a static path.
router.get('/:id', validate(reportIdParamsSchema, 'params'), asyncHandler(getReportById));

export default router;
