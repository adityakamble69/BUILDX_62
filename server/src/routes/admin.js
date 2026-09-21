import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  adminReportListQuerySchema,
  reportIdParamsSchema,
  commentIdParamsSchema,
  departmentIdParamsSchema,
  statusChangeSchema,
  assignDepartmentSchema,
  resolutionImageSchema,
  adminStatsQuerySchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  taskListQuerySchema,
  taskCreateSchema,
  taskStatusChangeSchema,
  taskIdParamsSchema,
  submissionListQuerySchema,
  submissionCreateSchema,
  submissionReviewSchema,
  submissionIdParamsSchema,
  incompleteQuerySchema,
} from '../validators/adminValidators.js';
import {
  getAdminReports,
  patchReportStatus,
  patchReportAssign,
  postResolutionImage,
  deleteAdminReport,
} from '../controllers/adminReportsController.js';
import { deleteAdminComment } from '../controllers/commentsController.js';
import { getAdminStatsController, getAdminHeatmap } from '../controllers/adminStatsController.js';
import {
  getAdminDepartments,
  postAdminDepartment,
  patchAdminDepartment,
} from '../controllers/adminDepartmentsController.js';
import {
  getAdminTasks,
  postAdminTask,
  patchAdminTaskStatus,
} from '../controllers/adminTasksController.js';
import {
  getAdminSubmissions,
  postAdminSubmission,
  patchAdminSubmissionReview,
} from '../controllers/adminSubmissionsController.js';
import {
  getAdminAnalytics,
  getAdminIncomplete,
} from '../controllers/adminAnalyticsController.js';
import { getAdminWorkers } from '../controllers/workersController.js';

const router = Router();
router.use(requireAdmin);

// --- Reports --------------------------------------------------------------
router.get('/reports', validate(adminReportListQuerySchema, 'query'), asyncHandler(getAdminReports));

router.patch(
  '/reports/:id/status',
  validate(reportIdParamsSchema, 'params'),
  validate(statusChangeSchema),
  asyncHandler(patchReportStatus),
);
router.patch(
  '/reports/:id/assign',
  validate(reportIdParamsSchema, 'params'),
  validate(assignDepartmentSchema),
  asyncHandler(patchReportAssign),
);
router.post(
  '/reports/:id/resolution-image',
  validate(reportIdParamsSchema, 'params'),
  validate(resolutionImageSchema),
  asyncHandler(postResolutionImage),
);
router.delete('/reports/:id', validate(reportIdParamsSchema, 'params'), asyncHandler(deleteAdminReport));

// --- Comments -------------------------------------------------------------
router.delete('/comments/:id', validate(commentIdParamsSchema, 'params'), asyncHandler(deleteAdminComment));

// --- Stats / heatmap ------------------------------------------------------
router.get('/stats', validate(adminStatsQuerySchema, 'query'), asyncHandler(getAdminStatsController));
router.get('/heatmap', asyncHandler(getAdminHeatmap));

// --- Departments ----------------------------------------------------------
router.get('/departments', asyncHandler(getAdminDepartments));
router.post('/departments', validate(departmentCreateSchema), asyncHandler(postAdminDepartment));
router.patch(
  '/departments/:id',
  validate(departmentIdParamsSchema, 'params'),
  validate(departmentUpdateSchema),
  asyncHandler(patchAdminDepartment),
);

// --- Tasks ----------------------------------------------------------------
router.get('/tasks', validate(taskListQuerySchema, 'query'), asyncHandler(getAdminTasks));
router.post('/tasks', validate(taskCreateSchema), asyncHandler(postAdminTask));
router.patch(
  '/tasks/:id/status',
  validate(taskIdParamsSchema, 'params'),
  validate(taskStatusChangeSchema),
  asyncHandler(patchAdminTaskStatus),
);

// --- Submissions ----------------------------------------------------------
router.get('/submissions', validate(submissionListQuerySchema, 'query'), asyncHandler(getAdminSubmissions));
router.post('/submissions', validate(submissionCreateSchema), asyncHandler(postAdminSubmission));
router.patch(
  '/submissions/:id/review',
  validate(submissionIdParamsSchema, 'params'),
  validate(submissionReviewSchema),
  asyncHandler(patchAdminSubmissionReview),
);

// --- Incomplete + Analytics -----------------------------------------------
router.get('/incomplete', validate(incompleteQuerySchema, 'query'), asyncHandler(getAdminIncomplete));
router.get('/analytics', asyncHandler(getAdminAnalytics));

// --- Workers (Phase 5-worker) ---------------------------------------------
router.get('/workers', asyncHandler(getAdminWorkers));

export default router;