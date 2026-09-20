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

// Every route in this router requires the admin role (architecture.md §9); the real
// protection is `requireAdmin` here, not the frontend's route guards.
const router = Router();
router.use(requireAdmin);

router.get('/reports', validate(adminReportListQuerySchema, 'query'), asyncHandler(getAdminReports));
// No GET /admin/reports/:id — the admin detail page reuses the public GET /reports/:id,
// which already returns photos, comments and status history (architecture.md endpoint list).

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

router.delete('/comments/:id', validate(commentIdParamsSchema, 'params'), asyncHandler(deleteAdminComment));

router.get('/stats', validate(adminStatsQuerySchema, 'query'), asyncHandler(getAdminStatsController));
router.get('/heatmap', asyncHandler(getAdminHeatmap));

router.get('/departments', asyncHandler(getAdminDepartments));
router.post('/departments', validate(departmentCreateSchema), asyncHandler(postAdminDepartment));
router.patch(
  '/departments/:id',
  validate(departmentIdParamsSchema, 'params'),
  validate(departmentUpdateSchema),
  asyncHandler(patchAdminDepartment),
);

export default router;
