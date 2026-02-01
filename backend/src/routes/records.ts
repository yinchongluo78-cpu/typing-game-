import { Router } from 'express';
import { body } from 'express-validator';
import { createRecord, getRecords, getRecordById } from '../controllers/recordController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

// 保存练习记录
router.post(
  '/',
  authMiddleware,
  [
    body('chapterId').notEmpty().withMessage('章节ID不能为空'),
    body('wpm').isFloat({ min: 0 }).withMessage('WPM必须是非负数'),
    body('accuracy').isFloat({ min: 0, max: 100 }).withMessage('正确率必须在0-100之间'),
    body('duration').isInt({ min: 0 }).withMessage('用时必须是非负整数'),
    body('errorCount').isInt({ min: 0 }).withMessage('错误次数必须是非负整数'),
    body('errors').optional().isArray(),
  ],
  validateRequest,
  createRecord
);

// 获取用户历史记录
router.get('/', authMiddleware, getRecords);

// 获取单条记录详情
router.get('/:id', authMiddleware, getRecordById);

export default router;
