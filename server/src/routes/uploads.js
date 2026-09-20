import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadSignSchema } from '../validators/uploadValidators.js';
import { postUploadSign } from '../controllers/uploadsController.js';

const router = Router();

router.post('/sign', requireAuth, validate(uploadSignSchema), asyncHandler(postUploadSign));

export default router;
