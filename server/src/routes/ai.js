import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiClassifyRateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiClassifySchema } from '../validators/aiValidators.js';
import { postAiClassify } from '../controllers/aiController.js';

// Requires auth like the rest of the report-creation flow (POST /uploads/sign,
// GET /reports/nearby-duplicates) — architecture.md §11's data flow runs this only for a
// signed-in citizen mid-wizard, never for guests.
const router = Router();

router.post('/classify', requireAuth, aiClassifyRateLimit, validate(aiClassifySchema), asyncHandler(postAiClassify));

export default router;
