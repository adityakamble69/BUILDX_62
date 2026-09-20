import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { commentIdParamsSchema } from '../validators/commentValidators.js';
import { deleteComment } from '../controllers/commentsController.js';

const router = Router();

router.delete('/:id', requireAuth, validate(commentIdParamsSchema, 'params'), asyncHandler(deleteComment));

export default router;
