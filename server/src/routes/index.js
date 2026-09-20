import { Router } from 'express';
import publicRoutes from './public.js';
import reportRoutes from './reports.js';
import commentRoutes from './comments.js';
import uploadRoutes from './uploads.js';
import meRoutes from './me.js';
import adminRoutes from './admin.js';

// Mounted at /api/v1.
const router = Router();

router.use('/', publicRoutes); // /categories, /stats/public
router.use('/reports', reportRoutes); // public reads + citizen writes, see reports.js for ordering
router.use('/comments', commentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/me', meRoutes);
router.use('/admin', adminRoutes);

export default router;
