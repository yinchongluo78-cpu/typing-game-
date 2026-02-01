import { Router } from 'express';
import { body } from 'express-validator';
import { syncData } from '../controllers/syncController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 同步游客数据到云端
router.post(
  '/',
  authMiddleware,
  [body('records').optional().isArray(), body('progress').optional().isArray()],
  validateRequest,
  syncData
);

export default router;
