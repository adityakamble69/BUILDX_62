import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Every admin route is behind requireAdmin. Real admin endpoints arrive in Phase 7;
// this ping exists so Phase 4's 401/403 behaviour is testable today.
router.use(requireAdmin);

router.get('/ping', (_req, res) => {
  res.json({ data: { ok: true } });
});

export default router;
