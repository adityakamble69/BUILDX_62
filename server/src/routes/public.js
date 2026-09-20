import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getCategories } from '../controllers/categoriesController.js';
import { getStatsPublic } from '../controllers/statsController.js';

// No auth required anywhere in this router (architecture.md §9).
const router = Router();

router.get('/categories', asyncHandler(getCategories));
router.get('/stats/public', asyncHandler(getStatsPublic));

export default router;
