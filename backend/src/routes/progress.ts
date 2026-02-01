import { Router } from 'express';
import { body } from 'express-validator';
import { getAllProgress, updateProgress } from '../controllers/progressController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 获取用户所有章节进度
router.get('/', authMiddleware, getAllProgress);

// 更新章节进度
router.put(
  '/:chapterId',
  authMiddleware,
  [
    body('status')
      .optional()
      .isIn(['not_started', 'in_progress', 'completed'])
      .withMessage('状态值无效'),
    body('bestWpm').optional().isFloat({ min: 0 }),
    body('bestAccuracy').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  updateProgress
);

export default router;
